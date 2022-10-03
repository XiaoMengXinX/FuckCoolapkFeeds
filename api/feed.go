package api

import (
	"context"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
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
			setTimeout("redirect()", 3000); 
			function redirect() {
				document.body.appendChild(document.createElement('iframe')).src='javascript:"<script>top.location.replace(\'' + {{.URL}} + '\')<\/script>"';
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

/*
func init() {
	if os.Getenv("MONGO_URI") != "" {
		client, err := connectDB(os.Getenv("MONGO_URI"))
		if err == nil {
			collection = client.Database("coolapk").Collection("feeds")
		}
	}
}
*/

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

	feedURL := fmt.Sprintf("http://www.coolapk.com/feed/%d", feedID)
	t, _ := template.New("index").Parse(htmlTmpl3)
	_ = t.Execute(w, feedURL)

}
