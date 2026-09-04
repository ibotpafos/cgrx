package backend

import "context"

type Server struct{}

func Run(ctx context.Context) {
	help()
}

func help() {}
