# renovate: datasource=docker depName=renovate/ubuntu versioning=docker
ARG UBUNTU_VERSION=18.04


#--------------------------------------
# base image
#--------------------------------------
FROM renovate/ubuntu:${UBUNTU_VERSION} as build

USER root

COPY --from=renovate/buildpack:2@sha256:e0fbe090375a4f2df1c6796ec6adf50b85b90038e00c29ff6e8bea4c090d6bdb /usr/local/build /usr/local/build
COPY --from=renovate/buildpack:2@sha256:e0fbe090375a4f2df1c6796ec6adf50b85b90038e00c29ff6e8bea4c090d6bdb /usr/local/bin /usr/local/bin

# loading env
ENV BASH_ENV=/usr/local/etc/env
SHELL ["/bin/bash" , "-c"]

ENTRYPOINT [ "docker-entrypoint.sh", "python-build" ]

RUN install-apt \
  build-essential \
  dumb-init \
  libbz2-dev \
  libffi-dev \
  liblzma-dev \
  libreadline-dev \
  libsqlite3-dev \
  libssl-dev \
  zlib1g-dev \
  ;

RUN set -ex; \
  git clone https://github.com/pyenv/pyenv.git; \
  pushd pyenv/plugins/python-build; \
  ./install.sh; \
  popd; \
  rm -rf pyenv;

# rebuild trigger
# renovate: datasource=docker depName=python versioning=docker
ENV PYTHON_VERSION=3.9.0
