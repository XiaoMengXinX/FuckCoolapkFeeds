package api

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	coolapk "github.com/XiaoMengXinX/CoolapkApi-Go"
	ent "github.com/XiaoMengXinX/CoolapkApi-Go/entities"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	authToken := r.Header.Get("X-Internal-Auth")
	expectedToken := os.Getenv("INTERNAL_AUTH_TOKEN")

	if expectedToken != "" && authToken != expectedToken {
		log.Printf("Unauthorized access attempt from %s", r.RemoteAddr)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Query parameter 'id' is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Query parameter 'id' must be a valid integer", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	c := coolapk.New()
	var feedDetail *ent.FeedDetail
	feedDetail, err = c.GetFeedDetailWithCtx(id, ctx)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			log.Printf("Request timed out for id %d: %v", id, err)
			http.Error(w, "The request to Coolapk API timed out", http.StatusGatewayTimeout)
			return
		}
		log.Printf("Error calling GetFeedDetailWithCtx for id %d: %v", id, err)
		http.Error(w, "Failed to fetch data from Coolapk API", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "s-maxage=600, stale-while-revalidate=0")

	statusCode := feedDetail.StatusCode
	if statusCode == 0 {
		statusCode = http.StatusOK
	}
	w.WriteHeader(statusCode)
	_, _ = w.Write([]byte(feedDetail.Response))
}
