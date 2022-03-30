package api

import (
	"context"
	"coolapk"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type feedData struct {
	ID        string    `bson:"id"`
	ShareUrl  string    `bson:"share_url"`
	Message   string    `bson:"message"`
	ReqTimes  int64     `bson:"requested_times"`
	CreatedAt time.Time `bson:"created_at"`
}

var collection *mongo.Collection
var html = `
<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>酷安动态</title>
<meta name="description" content="%s">
<meta property="og:title" content="酷安动态">
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

		feedDetail, err := coolapk.GetFeedDetailWithContext(feedID, ctx)
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
		_, _ = fmt.Fprint(w, fmt.Sprintf(html, message))
	} else {
		http.Redirect(w, r, data.ShareUrl, http.StatusMovedPermanently)
	}
	return
}
