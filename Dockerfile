ARG FLAVOR=latest


#--------------------------------------
# base image
#--------------------------------------
FROM renovate/buildpack:3-${FLAVOR} as build

ENTRYPOINT [ "docker-entrypoint.sh", "builder.sh" ]


RUN install-apt \
  build-essential \
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

COPY bin /usr/local/bin

# rebuild trigger
# renovate: datasource=docker depName=python versioning=docker
ARG PYTHON_VERSION=3.9.1
