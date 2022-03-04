package api

import (
	"coolapk"
	"fmt"
	"net/http"
	"strconv"
)

func UrlHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) <= 1 {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
		return
	}
	feedID, _ := strconv.Atoi(r.URL.Path[1:])
	feedDetail, err := coolapk.GetFeedDetail(feedID)
	if err != nil {
		w.WriteHeader(500)
		_, _ = fmt.Fprintf(w, "Internal Error")
		return
	}
	if feedDetail.Data.ShareUrl != "" {
		http.Redirect(w, r, feedDetail.Data.ShareUrl, http.StatusMovedPermanently)
	} else {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
	}
	return
}
