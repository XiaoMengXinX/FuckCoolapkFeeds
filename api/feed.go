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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type feedData struct {
	ID        string    `bson:"id"`
	ShareUrl  string    `bson:"share_url"`
	Message   string    `bson:"message"`
	PicURL    string    `bson:"pic_url"`
	ReqTimes  int64     `bson:"requested_times"`
	CreatedAt time.Time `bson:"created_at"`
}

var collection *mongo.Collection
var htmlTmpl = `
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>酷安动态</title>
<meta property="og:description" content="{{.Message}}">
<meta property="og:title" content="酷安动态">
<meta name="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="{{.Pic}}">
</head>
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
			_, _ = fmt.Fprintf(w, "Invaid Feed ID")
			return
		}

		b, _ := json.Marshal(feedDetail)
		fmt.Println(string(b))

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
		http.Redirect(w, r, data.ShareUrl, http.StatusMovedPermanently)
	}
	return
}
