#!/usr/bin/env bash

$(aws ecr get-login --no-include-email --region eu-west-1)
docker build -t 178402416679.dkr.ecr.eu-west-1.amazonaws.com/queuemetrics-api:${CI_COMMIT_HASH} .
docker tag 178402416679.dkr.ecr.eu-west-1.amazonaws.com/queuemetrics-api:${CI_COMMIT_HASH} 178402416679.dkr.ecr.eu-west-1.amazonaws.com/queuemetrics-api:latest
docker push 178402416679.dkr.ecr.eu-west-1.amazonaws.com/queuemetrics-api:${CI_COMMIT_HASH}
docker push 178402416679.dkr.ecr.eu-west-1.amazonaws.com/queuemetrics-api:latest
