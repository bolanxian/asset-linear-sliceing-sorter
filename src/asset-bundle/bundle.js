//base on https://github.com/esterTion/unity-texture-toolkit/blob/master/UnityBundle.php
import utils from './utils'
const { Buffer, Reader, BufferReader }=utils
import lzma from 'lzma-purejs'
const lzma_view=new DataView(new ArrayBuffer(8))
const lzma_uncompress_stream=(data,uncompressedSize)=>{
  lzma_view.setBigInt64(0,BigInt(uncompressedSize),true)
  return lzma.decompressFile(Buffer.concat([
    data.slice(0,5),Buffer.from(lzma_view.buffer),data.slice(5)
  ]))
}
import lz4 from 'lz4js'
const lz4_magic=Buffer.from('04224d1840700000000000','hex')
const lz4_uncompress_stream=(data,uncompressedSize)=>{
  lz4_magic.writeUInt32LE(data.length,7)
  return Buffer.from(lz4.decompress(Buffer.concat([lz4_magic,data]),uncompressedSize))
}

class Bundle{
  constructor(bundle){
    var header=this.header=bundle.readStringToNull()
    if(header!='UnityFS'&&header!='UnityRaw'){
      throw new Error('unknown header: '+header)
    }
    var format=this.format=bundle.readInt32()
    var versionPlayer=this.versionPlayer=bundle.readStringToNull()
    var versionEngine=this.versionEngine=bundle.readStringToNull()

    if(format<6){
      bundle.readUint32()
      bundle.readUint16()
      let offset=bundle.readInt16()
      bundle.readUint32()
      let lzmaChunks=bundle.readInt32()
      let lzmaSize=0
      for(let i=0; i<lzmaChunks; i++) {
        lzmaSize=bundle.readInt32()
        bundle.readUint32()
      }
      bundle.position=offset

      // getFiles
      let fileCount=bundle.readInt32()
      let fileList=new Map()
      for (let i=0; i<fileCount; i++) {
        let filename=bundle.readStringToNull()
        let fileOffset=bundle.readInt32() + offset
        let fileSize=bundle.readInt32()
        let nextFile=bundle.position

        bundle.position=fileOffset
        fileList.set(filename, bundle.readData(fileSize))
        bundle.position=nextFile
      }
      this.fileList=fileList
      return
    } else if (format == 6) {
    } else if (format == 7) {
    } else {
      throw new Error('unknown version: '+format)
    }

    bundle.readInt64()
    var compressedSize=bundle.readInt32()
    var uncompressedSize=bundle.readInt32()
    var flag=bundle.readInt32()

    if ((flag & 128) != 0) {
      throw new Error('block info at end')
    }else{
      if(format==7){bundle.alignStream(16)}
      var blocksInfoBytes=bundle.readData(compressedSize)
    }

    switch (flag & 63) {
      case 0:// Not compressed
        var uncompressedData=blocksInfoBytes
        break
      case 1:
        //this.uncompressedData=lzma_uncompress_stream(blocksInfoBytes,uncompressedSize)
        throw new Error('lzma compressed block info')
      case 2:
      case 3:
        uncompressedData=lz4_uncompress_stream(blocksInfoBytes, uncompressedSize)
        break
      default:
        throw new Error('unknown flag')
    }
    var blocksInfo=new BufferReader(uncompressedData)
    blocksInfo.seek(16)
    {
      let blockCount=blocksInfo.readInt32()
      let assetsData=[]
      for (let i=0; i<blockCount; i++) {
        let uncompressedSize=blocksInfo.readInt32()
        let compressedSize=blocksInfo.readInt32()
        let flag=blocksInfo.readInt16()

        let chunkData=bundle.readData(compressedSize)
        switch (flag & 63) {
          case 0:// not compressed
            assetsData.push(chunkData)
            break
          case 1:// 7zip
            assetsData.push(lzma_uncompress_stream(chunkData,uncompressedSize))
          case 2:
          case 3:
            assetsData.push(lz4_uncompress_stream(chunkData, uncompressedSize))
        }
      }
      this.assetsData=new BufferReader(Buffer.concat(assetsData))
    }{
      let entryInfoCount=blocksInfo.readInt32()
      let entryInfos=this.entryInfos=[]
      let offset,size,filename
      for(let i=0;i<entryInfoCount;i++){
        offset=blocksInfo.readInt64()
        size=blocksInfo.readInt64()
        blocksInfo.readInt32()
        filename=blocksInfo.readStringToNull()
        entryInfos.push({
          offset,
          size,
          filename
        })
      }
    }
  }
  extract(){
    if(this.fileList)return this.fileList
    var fileList=new Map()
    for(var info of this.entryInfos){
      this.assetsData.position=Number(info.offset)
      var file=this.assetsData.readData(Number(info.size))
      fileList.set(info.filename,file)
    }
    return fileList
  }
}

export default Object.assign(Bundle,{
  Buffer,lz4,lzma,
  lzma_uncompress_stream,
  lz4_uncompress_stream,
  Reader,
  BufferReader
})