# github secrets - main_repo

## NODE_BACKEND_LOCAL_ENV

- 실제 main repo즉 backend에서 사용하는 환경변수 입니다.
- 우리가 실제 local에서 개발할때 사용하는 환경변수를 그대로 넣으시면 됩니다. 

## NODE_BACKEND_ENV_TEST_SERVER

- 테스트 서버에 사용할 수 있는 환경변수 입니다. 
- 테스트 서버에서 집적적으로 사용할 수 있습니다. 

## NODE_BACKEND_ENV_DEPLOY_SERVER

- 배포 서버에 사용할 수 있는 환경변수 입니다. 

## DOCKER_HUB_USERNAME
## DOCKER_HUB_ACCESS_TOKEN

- dockerhub에 로그인 할 때 사용하는 token이랑 username입니다.

## TEST_SERVER_HOST
## TEST_SERVER_USER
## TEST_SERVER_SSH_KEY

- test 서버에 host, user, ssh_key의 값이 나와있습니다.

# github vars - main_repo

## BACKEND_LOCAL_URL

- 실행하고 있는 backend docker container를 테스트 할때 사용하는 url 입니다. 

## FRONTEND_LOCAL_URL

- 실행하고 있는 frontend docker container를 테스트 할때 사용하는 url 입니다.

## DOCKER_FRONTEND_TEST_SERVER_IMG
## DOCKER_MAIN_BACKEND_TEST_SERVER_IMG

- docker에서 사용하는 server_img 이다. 

## TEST_URL

- 통합 테스트에서 사용할 test_url 입니다.