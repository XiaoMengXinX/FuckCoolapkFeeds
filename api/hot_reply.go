package api

import (
	"fmt"
	"net/http"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	shared "github.com/XiaoMengXinX/FuckCoolapkFeeds/_shared"
)

func HotReplyHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel, ok := shared.Begin(w, r)
	if !ok {
		return
	}
	defer cancel()

	id, ok := shared.RequiredInt(w, r, "id")
	if !ok {
		return
	}
	page, ok := shared.OptionalInt(w, r, "page", 1)
	if !ok {
		return
	}

	c := coolapk.New()
	res, err := c.GetHotReplyListWithCtx(id, page, ctx)
	if err != nil {
		shared.Fail(w, err, fmt.Sprintf("hot replies of id %d, page %d", id, page))
		return
	}
	shared.Write(w, res.StatusCode, res.Response)
}
