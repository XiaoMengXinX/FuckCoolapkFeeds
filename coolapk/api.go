package coolapk

import (
	"context"
	"encoding/json"
	"fmt"
)

func GetFeedDetailWithContext(id int, ctx context.Context) (result FeedData, err error) {
	path := "/v6/feed/detail"
	parameters := make(map[string]string)
	parameters["id"] = fmt.Sprintf("%d", id)
	response, err := request(path, parameters, ctx)
	if err != nil {
		return
	}
	err = json.Unmarshal(response, &result)
	return
}

func GetFeedDetail(id int) (result FeedData, err error) {
	return GetFeedDetailWithContext(id, context.Background())
}
