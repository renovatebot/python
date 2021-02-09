#!/bin/bash

VERSION=${1}

CODENAME=$(. /etc/os-release && echo ${VERSION_CODENAME})

NAME=python

echo "Building ${NAME} ${VERSION} for ${CODENAME}"
python-build ${VERSION} /usr/local/${NAME}/${VERSION}

echo "Compressing ${NAME} ${VERSION} for ${CODENAME}"
tar -cJf /cache/${NAME}-${VERSION}-${CODENAME}.tar.xz -C /usr/local/${NAME} ${VERSION}
