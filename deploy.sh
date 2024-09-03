gcloud config configurations active default
docker build -t asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be --platform linux/amd64 .
docker push asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be
docker rmi asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be
gcloud run deploy my-commerce-be-v1 --image=asia-southeast1-docker.pkg.dev/test-gcp-new-432115/my-commerce/my-commerce-be:latest --region=asia-southeast1 --project=test-gcp-new-432115
