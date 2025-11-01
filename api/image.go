package api

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func ImageProxyHandler(w http.ResponseWriter, r *http.Request) {
	imageUrl := r.URL.Query().Get("url")
	if imageUrl == "" {
		http.Error(w, "Query parameter 'url' is required", http.StatusBadRequest)
		return
	}

	// To prevent misuse, we should validate that the URL is from coolapk.
	parsedURL, err := url.Parse(imageUrl)
	if err != nil || (parsedURL.Host != "image.coolapk.com" && parsedURL.Host != "avatar.coolapk.com") {
		http.Error(w, "Invalid image URL", http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	req, err := http.NewRequest("GET", imageUrl, nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Add all the headers to mimic a real browser request
	req.Header.Set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("DNT", "1")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Referer", "https://www.coolapk.com/")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "no-cors")
	req.Header.Set("Sec-Fetch-Site", "same-site")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")
	req.Header.Set("sec-ch-ua", `"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", `"macOS"`)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to fetch image", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		cacheTTL := 864000
		cacheControlValue := fmt.Sprintf("public, s-maxage=%d, max-age=%d", cacheTTL, cacheTTL)
		w.Header().Set("Cache-Control", cacheControlValue)
	} else if resp.StatusCode == http.StatusNotFound {
		cacheTTL := 60
		cacheControlValue := fmt.Sprintf("public, s-maxage=%d, max-age=%d", cacheTTL, cacheTTL)
		w.Header().Set("Cache-Control", cacheControlValue)
	}

	for name, values := range resp.Header {
		if name == "Cache-Control" {
			continue
		}
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
