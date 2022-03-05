package api

import (
	"coolapk"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

var html = `
<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>酷安动态</title>
<meta name="description" content="%s">
<meta property="og:title" content="酷安动态">
</head>
`

func UrlHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) <= 1 {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
		return
	}
	feedID, _ := strconv.Atoi(strings.Split(strings.Trim(r.URL.Path[1:], "/feed/"), "?")[0])
	feedDetail, err := coolapk.GetFeedDetail(feedID)
	if err != nil {
		w.WriteHeader(500)
		_, _ = fmt.Fprintf(w, "Internal Error")
		return
	}
	if feedDetail.Data.ShareUrl == "" {
		_, _ = fmt.Fprintf(w, "Invaid Feed ID")
	}
	if strings.Contains(r.UserAgent(), "bot") || strings.Contains(r.UserAgent(), "Bot") {
		re := regexp.MustCompile("\\<[\\S\\s]+?\\>")
		message := re.ReplaceAllString(feedDetail.Data.Message, "")
		_, _ = fmt.Fprintf(w, fmt.Sprintf(html, message))
	} else {
		http.Redirect(w, r, feedDetail.Data.ShareUrl, http.StatusMovedPermanently)
	}
	return
}
