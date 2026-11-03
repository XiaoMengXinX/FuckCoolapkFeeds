package api

import (
	"fmt"
	"net/http"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	shared "github.com/XiaoMengXinX/FuckCoolapkFeeds/_shared"
)

func TagFeedHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel, ok := shared.Begin(w, r)
	if !ok {
		return
	}
	defer cancel()

	tag, ok := shared.RequiredString(w, r, "tag")
	if !ok {
		return
	}
	page, ok := shared.OptionalInt(w, r, "page", 1)
	if !ok {
		return
	}

	c := coolapk.New()
	res, err := c.GetTagFeedListWithCtx(tag, page, ctx)
	if err != nil {
		shared.Fail(w, err, fmt.Sprintf("tag %s, page %d", tag, page))
		return
	}
	shared.Write(w, res.StatusCode, res.Response)
}
