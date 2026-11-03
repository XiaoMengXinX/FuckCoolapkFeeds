package api

import (
	"fmt"
	"net/http"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	shared "github.com/XiaoMengXinX/FuckCoolapkFeeds/_shared"
)

func FeedHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel, ok := shared.Begin(w, r)
	if !ok {
		return
	}
	defer cancel()

	id, ok := shared.RequiredInt(w, r, "id")
	if !ok {
		return
	}

	c := coolapk.New()
	res, err := c.GetFeedDetailWithCtx(id, ctx)
	if err != nil {
		shared.Fail(w, err, fmt.Sprintf("feed id %d", id))
		return
	}
	shared.Write(w, res.StatusCode, res.Response)
}
