package coolapk

import (
	"crypto/md5"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"github.com/google/uuid"
	"time"
)

func NewToken() (token string) {
	UUID := uuid.New().String()

	timeUnix := time.Now().Unix()
	timeHex := fmt.Sprintf("0x%x", timeUnix)
	md5byte := md5.Sum([]byte(fmt.Sprintf("%d", timeUnix)))
	timeMD5 := hex.EncodeToString(md5byte[:])

	spliceStr := fmt.Sprintf(`token://com.coolapk.market/c67ef5943784d09750dcfbb31020f0ab?%s$%s&com.coolapk.market`, timeMD5, UUID)

	base64Str := base64.StdEncoding.EncodeToString([]byte(spliceStr))

	md5byte = md5.Sum([]byte(base64Str))
	md5Str := hex.EncodeToString(md5byte[:])

	token = md5Str + UUID + timeHex
	return
}
