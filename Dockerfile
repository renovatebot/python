# renovate: datasource=docker depName=ubuntu versioning=docker
ARG UBUNTU_VERSION=20.04


#--------------------------------------
# base image
#--------------------------------------
FROM renovate/ubuntu:${UBUNTU_VERSION} as build

USER root

COPY --from=renovate/buildpack:2 /usr/local/build /usr/local/build
COPY --from=renovate/buildpack:2 /usr/local/bin /usr/local/bin

# loading env
ENV BASH_ENV=/usr/local/etc/env
SHELL ["/bin/bash" , "-c"]

ENTRYPOINT [ "docker-entrypoint.sh" ]

RUN install-apt dumb-init build-essential libssl-dev libreadline-dev zlib1g-dev libffi-dev

RUN set -ex; \
  git clone https://github.com/pyenv/pyenv.git; \
  pushd pyenv/plugins/python-build; \
  ./install.sh; \
  popd; \
  rm -rf pyenv;


# renovate: datasource=docker depName=python versioning=docker
ARG PYTHON_VERSION=3.7.5
