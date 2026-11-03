package shared

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

const requestTimeout = 5 * time.Second

// Begin has already written the error response when ok is false.
func Begin(w http.ResponseWriter, r *http.Request) (ctx context.Context, cancel context.CancelFunc, ok bool) {
	expectedToken := os.Getenv("INTERNAL_AUTH_TOKEN")
	if expectedToken != "" && r.Header.Get("X-Internal-Auth") != expectedToken {
		log.Printf("Unauthorized access attempt from %s", r.RemoteAddr)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return nil, nil, false
	}
	ctx, cancel = context.WithTimeout(r.Context(), requestTimeout)
	return ctx, cancel, true
}

func RequiredString(w http.ResponseWriter, r *http.Request, name string) (string, bool) {
	value := r.URL.Query().Get(name)
	if value == "" {
		http.Error(w, fmt.Sprintf("Query parameter '%s' is required", name), http.StatusBadRequest)
		return "", false
	}
	return value, true
}

func RequiredInt(w http.ResponseWriter, r *http.Request, name string) (int, bool) {
	value, ok := RequiredString(w, r, name)
	if !ok {
		return 0, false
	}
	return parseInt(w, name, value)
}

func OptionalInt(w http.ResponseWriter, r *http.Request, name string, fallback int) (int, bool) {
	value := r.URL.Query().Get(name)
	if value == "" {
		return fallback, true
	}
	return parseInt(w, name, value)
}

func parseInt(w http.ResponseWriter, name, value string) (int, bool) {
	n, err := strconv.Atoi(value)
	if err != nil {
		http.Error(w, fmt.Sprintf("Query parameter '%s' must be a valid integer", name), http.StatusBadRequest)
		return 0, false
	}
	return n, true
}

func Fail(w http.ResponseWriter, err error, logContext string) {
	if errors.Is(err, context.DeadlineExceeded) {
		log.Printf("Request timed out for %s: %v", logContext, err)
		http.Error(w, "The request to Coolapk API timed out", http.StatusGatewayTimeout)
		return
	}
	log.Printf("Coolapk API call failed for %s: %v", logContext, err)
	http.Error(w, "Failed to fetch data from Coolapk API", http.StatusInternalServerError)
}

func Write(w http.ResponseWriter, statusCode int, body string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "s-maxage=600, stale-while-revalidate=0")
	if statusCode == 0 {
		statusCode = http.StatusOK
	}
	w.WriteHeader(statusCode)
	_, _ = w.Write([]byte(body))
}
