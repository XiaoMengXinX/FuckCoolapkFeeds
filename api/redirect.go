package api

import "net/http"

func Redirect(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		return
	}
	http.Redirect(w, r, url, http.StatusFound)
}
