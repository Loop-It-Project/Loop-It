terraform {
  backend "s3" {
    bucket         = "loop-it-terraform-state-200288d4"
    key            = "infrastructure/terraform.tfstate"
    region         = "eu-central-1"
    encrypt        = true
  #  use_lockfile   = true
  }
}
