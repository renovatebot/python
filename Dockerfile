#--------------------------------------
# base image
#--------------------------------------
FROM renovate/buildpack:4@sha256:ffe1aaf6db31f7a081806a028fef5369b3f78395b3a87707d3f82d4cadbe796d as build


# build target, name required by binary-builder
ARG FLAVOR
RUN . /etc/os-release; [ "${VERSION_CODENAME}" == "${FLAVOR}" ] || exit 55


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
