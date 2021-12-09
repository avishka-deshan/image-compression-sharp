This project is for compressing AWS CloudFront images on the fly with Lambda, Lambda edge and a s3 origin. Here we use NodeJS sharp library for the compression process. The compression will run on lambda edge in each origin response event.

This project will be useful to those who are looking for a solution to serve compressed images through CloudFront without storing compressed images on s3 separately.

Deploy the compression function in lambda in the same region where your s3 bucket is located. Deploy the lambda edge function in us-east-1 region and deploy it to lambda edge. Set up the IAM roles accordingly. 

For more info visit my medium profile
https://medium.com/@avishkaDeshan

For more info contact me via email : amavishka456@gmail.com

