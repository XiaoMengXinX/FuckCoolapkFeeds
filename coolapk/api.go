package coolapk

import (
	"encoding/json"
	"fmt"
)

func GetFeedDetail(id int) (result FeedData, err error) {
	path := "/v6/feed/detail"
	parameters := make(map[string]string)
	parameters["id"] = fmt.Sprintf("%d", id)
	response, err := request(path, parameters)
	if err != nil {
		return
	}
	err = json.Unmarshal(response, &result)
	return
}
