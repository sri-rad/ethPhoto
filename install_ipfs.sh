MACHINE_TYPE=`uname -m`
if [ ${MACHINE_TYPE} == 'x86_64' ]; then
  wget https://dist.ipfs.io/go-ipfs/v0.4.7/go-ipfs_v0.4.7_linux-amd64.tar.gz
  tar xvfz go-ipfs_v0.4.7_linux-amd64.tar.gz
else
  wget https://dist.ipfs.io/go-ipfs/v0.4.7/go-ipfs_v0.4.7_linux-386.tar.gz
  tar xvfz go-ipfs_v0.4.7_linux-386.tar.gz
fi

sudo mv go-ipfs/ipfs /usr/local/bin/ipfs



