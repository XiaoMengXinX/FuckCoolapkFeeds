package api

import (
	"fmt"
	"net/http"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	shared "github.com/XiaoMengXinX/FuckCoolapkFeeds/_shared"
)

func HeadlinesHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel, ok := shared.Begin(w, r)
	if !ok {
		return
	}
	defer cancel()

	page, ok := shared.OptionalInt(w, r, "page", 1)
	if !ok {
		return
	}

	c := coolapk.New()
	res, err := c.GetTopHeadlinesWithCtx(page, ctx)
	if err != nil {
		shared.Fail(w, err, fmt.Sprintf("headlines page %d", page))
		return
	}
	shared.Write(w, res.StatusCode, res.Response)
}
