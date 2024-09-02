docker build -t my-commerce-be --platform linux/amd64 .
docker tag my-commerce-be asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be
docker push asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be
