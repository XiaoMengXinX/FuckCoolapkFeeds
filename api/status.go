package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
)

type returnJson struct {
	Status   int         `json:"status"`
	Message  string      `json:"Message"`
	Error    interface{} `json:"error"`
	ShareURL string      `json:"share_url"`
	Header   interface{} `json:"header"`
}

func StatusHander(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.TODO(), time.Second*5)
	defer cancel()
	var returnData returnJson
	c := coolapk.New()
	feedDetail, err := c.GetFeedDetailWithCtx(14640271, ctx)
	returnData.Status = feedDetail.Status
	returnData.Message = feedDetail.Message
	returnData.Error = err
	returnData.ShareURL = feedDetail.Data.ShareUrl
	returnData.Header = feedDetail.Header
	b, _ := json.Marshal(returnData)
	_, _ = fmt.Fprintf(w, string(b))
}
