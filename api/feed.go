package api

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var bot = &tgbotapi.BotAPI{
	Token:  os.Getenv("BOT_TOKEN"),
	Client: &http.Client{},
	Buffer: 100,
}
var chatID, _ = strconv.Atoi(os.Getenv("CHAT_ID"))

func init() {
	bot.SetAPIEndpoint(tgbotapi.APIEndpoint)
}

type feedData struct {
	ID        string    `bson:"id"`
	ShareUrl  string    `bson:"share_url"`
	Message   string    `bson:"message"`
	PicURL    string    `bson:"pic_url"`
	ReqTimes  int64     `bson:"requested_times"`
	CreatedAt time.Time `bson:"created_at"`
}

var collection *mongo.Collection
var htmlTmpl = `<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta property="og:description" content="{{.Message}}">
<meta property="og:title" content="酷安动态">
<meta name="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="{{.Pic}}">
<meta property="twitter:image" content="{{.Pic}}.m.jpg">
<!-- <meta property="twitter:image" content="{{.Pic}}.xs.jpg"> -->
</head>
`
var htmlTmpl2 = `<!DOCTYPE html>
<html lang="zh">
	<body>
		<script type="text/javascript"> 
			var t = 3;
			setInterval("countdown()", 1000);
			setTimeout(, 3000); 
			function redirect() {
				window.location.replace("/redirect?url={{.URL}}");
			}
			function countdown() {
				document.getElementById('show').innerHTML = "<h1> {{.Message}}" + t + "秒后跳转到原链接 </h1>";
				if (t != 0){
					t--;
				}
			}
		</script>
		<span id="show"></span>
	</body>
</html>
`
var htmlTmpl3 = `<!DOCTYPE html>
<html lang="zh">
	<body>
		<script type="text/javascript">
			 window.location.replace("/redirect?url={{.}}");
		</script>
	</body>
</html>
`

func connectDB(uri string) (*mongo.Client, error) {
	serverAPIOptions := options.ServerAPI(options.ServerAPIVersion1)
	clientOptions := options.Client().
		ApplyURI(uri).
		SetServerAPIOptions(serverAPIOptions)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return mongo.Connect(ctx, clientOptions)
}

func init() {
	if os.Getenv("MONGO_URI") != "" {
		client, err := connectDB(os.Getenv("MONGO_URI"))
		if err == nil {
			collection = client.Database("coolapk").Collection("feeds")
		}
	}
}

func UrlHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) <= 1 {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
		return
	}
	feedID, err := strconv.Atoi(strings.Split(strings.Trim(r.URL.Path[1:], "/feed/"), "?")[0])
	if err != nil {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
		return
	}

	var data feedData
	var e error
	if collection != nil {
		ctx, cancel := context.WithTimeout(context.TODO(), time.Second*2)
		defer cancel()
		e = collection.FindOne(ctx, bson.M{"id": fmt.Sprintf("%d", feedID)}).Decode(&data)
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	feedURL := fmt.Sprintf("https://www.coolapk.com/feed/%d", feedID)

	if e != nil || collection == nil {
		ctx, cancel := context.WithTimeout(context.TODO(), time.Second*5)
		defer cancel()

		c := coolapk.New()
		feedDetail, err := c.GetFeedDetailWithCtx(feedID, ctx)
		if err != nil { // 超时刷新重试
			scheme := "http://"
			if r.TLS != nil {
				scheme = "https://"
			}
			url := scheme + r.Host + r.RequestURI
			http.Redirect(w, r, url, http.StatusMovedPermanently)
			return
		}
		if feedDetail.Data.ShareUrl == "" {
			if bot.Token != "" {
				loc, _ := time.LoadLocation("Asia/Hong_Kong")
				var respJson interface{}
				_ = json.Unmarshal([]byte(feedDetail.Response), &respJson)
				jsonBytes, _ := json.MarshalIndent(struct {
					ClientInfo interface{} `json:"client_info"`
					UserAgent  interface{} `json:"user_agent"`
					DeviceID   interface{} `json:"device_id"`
					Response   interface{} `json:"response"`
				}{
					ClientInfo: c.FakeClient,
					UserAgent:  c.UserAgent,
					DeviceID:   c.DeviceID,
					Response:   respJson,
				}, "", "  ")
				msg := tgbotapi.NewDocument(int64(chatID), tgbotapi.FileBytes{
					Name:  fmt.Sprintf("%d_%s.json", feedID, time.Now().In(loc).Format("2006-01-02_15-04-05")),
					Bytes: jsonBytes,
				})
				msg.Caption = feedURL + "\n" + feedURL[:19] + "1s" + feedURL[19:]
				_, err = bot.Send(msg)
			}
			/*
				w.Header().Set("Content-Type", "text/plain; charset=utf-8")
				_, _ = fmt.Fprintf(w, "Invaid Feed ID: %s\nError Code: %d", feedDetail.Message, feedDetail.Status)
			*/
			message := "获取 ShareKey 失败"
			if feedDetail.Message != "" {
				message += "：" + feedDetail.Message
			}
			t, _ := template.New("index").Parse(htmlTmpl2)
			_ = t.Execute(w, struct {
				Message string
				URL     string
			}{
				Message: message + "<br>",
				URL:     strings.ReplaceAll(feedURL, "https", "http"),
			})
			return
		}

		if feedDetail.Data.MessageCover != "" {
			data.PicURL = feedDetail.Data.MessageCover
		} else if feedDetail.Data.Pic != "" {
			data.PicURL = feedDetail.Data.Pic
		} else if len(feedDetail.Data.PicArr) != 0 {
			data.PicURL = feedDetail.Data.PicArr[0]
		}

		data.ID = fmt.Sprintf("%d", feedID)
		data.ShareUrl = feedDetail.Data.ShareUrl
		data.Message = feedDetail.Data.Message
		data.CreatedAt = time.Now()
	}
	data.ReqTimes++

	if collection != nil {
		ctx, cancel := context.WithTimeout(context.TODO(), time.Second*2)
		defer cancel()
		if e != nil {
			_, err = collection.InsertOne(ctx, data)
		} else {
			_, err = collection.UpdateOne(ctx, bson.M{"id": data.ID}, bson.M{"$set": bson.M{"requested_times": data.ReqTimes}})
		}
	}

	if strings.Contains(r.UserAgent(), "bot") || strings.Contains(r.UserAgent(), "Bot") {
		re := regexp.MustCompile("\\<[\\S\\s]+?\\>")
		message := re.ReplaceAllString(data.Message, "")
		t, _ := template.New("index").Parse(htmlTmpl)
		_ = t.Execute(w, struct {
			Message string
			Pic     string
		}{
			Message: message,
			Pic:     data.PicURL,
		})
	} else {
		//http.Redirect(w, r, data.ShareUrl, http.StatusMovedPermanently)
		t, _ := template.New("index").Parse(htmlTmpl3)
		_ = t.Execute(w, strings.ReplaceAll(data.ShareUrl, "https", "http"))
	}
	return
}
