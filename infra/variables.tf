variable "s3_bucket_regional_domain" {
  description = "S3 bucket regional domain (e.g. my-bucket.s3.ap-southeast-2.amazonaws.com)"
  type        = string
}

variable "s3_origin_id" {
  description = "The origin ID assigned to the S3 origin in the existing CloudFront distribution"
  type        = string
}

variable "s3_oac_id" {
  description = "CloudFront Origin Access Control ID for the S3 origin"
  type        = string
}

variable "api_origin_domain" {
  description = "Railway API domain without scheme (e.g. portfolio-api.up.railway.app)"
  type        = string
}

variable "domain_aliases" {
  description = "Custom domain aliases served by this distribution"
  type        = list(string)
  default     = []
}

variable "web_acl_id" {
  description = "WAF Web ACL ARN to associate with the CloudFront distribution"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
}
