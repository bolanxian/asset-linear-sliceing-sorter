import { B as Buffer$2, i as isBuffer, l as lz4, a as lzma, V as Vue, b as iview, c as Viewer } from './vendor.314ee7d6.js';

const style = '';

const {now}=Date;
const noop$1=()=>{};
const delay=t=>new Promise(ok=>{setTimeout(ok,t);});
const delay0_=ok=>{setTimeout(ok,0);};
const delay0=t=>new Promise(delay0_);
const timeIter=()=>{
  var prev=now(),cur,time;
  return ()=>{
    cur=now();
    time=cur-prev;
    prev=cur;
    return time
  }
};

const generToFunc$1=(obj,key)=>{
  const generKey='x'+key;
  Object.assign(obj,{
    [key](value,_){
      for(_ of this[generKey](value)){}
    },
    async [key+'Async'](value,onprogress){
      onprogress=onprogress||noop$1;
      const time=timeIter();
      for(var stat of this[generKey](value)){//{i,size,name}
        stat.time=time();
        onprogress(stat);
        await delay0();
        time();
      }
    }
  });
};
const proxyHandle={
  get(target,name){
    if(name in target){return target[name]}
    else {return target.__get(name)}
  }
};

class Reader$1{
  constructor(){
    this.position=0;
    this.size=0;
    this.littleEndian=false;
    return new Proxy(this,proxyHandle)
  }
  __get(name){
    console.warn(`Access ${name} of <${new Error().stack.split('\n',3)[2]}>`);
    switch(name) {
      case 'short': return this.readInt16()
      case 'ushort': return this.readUint16()
      case 'long': return this.readInt32()
      case 'ulong': return this.readUint32()
      case 'longlong': return this.readInt64()
      case 'ulonglong': return this.readUint64()
      case 'float': return this.readFloat()
      case 'double': return this.readDouble()
      case 'string': return this.readStringToNull()
      case 'line': return this.readStringToReturn()
    }
  }
  readStringToNull(){
    var s='',$char;
    while(($char=this.read(1)[0])!=0){
      s+=String.fromCharCode($char);
    }
    return s
  }
  readStringAt(pos){
    var current=this.position;
    this.position=pos;
    var data=this.readStringToNull();
    this.position=current;
    return data
  }
  readStringToReturn(){
    var s='',$char,$n='\n'.charCodeAt();
    while(this.position<this.size&&($char=this.read(1)[0])!=$n){
      s+=String.fromCharCode($char);
    }
    return s.trim()
  }
  readBoolean() {
    return this.read(1)[0]>0
  }
  readByte(){
    return this.read(1)[0]
  }
  readInt16(){
    var int=this.read(2);
    if (int.length!=2) return 0
    return int[this.littleEndian?'readInt16LE':'readInt16BE'](0)
  }
  readUint16(){
    var int=this.read(2);
    if (int.length!=2) return 0
    return int[this.littleEndian?'readUInt16LE':'readUInt16BE'](0)
  }
  readInt32(){
    var int=this.read(4);
    if (int.length!=4) return 0
    return int[this.littleEndian?'readInt32LE':'readInt32BE'](0)
  }
  readUint32(){
    var int=this.read(4);
    if (int.length!=4) return 0
    return int[this.littleEndian?'readUInt32LE':'readUInt32BE'](0)
  }
  readInt64(){
    var int=this.read(8);
    if (int.length!=8) return 0
    var view=new DataView(int.buffer,int.byteOffset);
    return view.getBigInt64(0,this.littleEndian)
  }
  readUint64(){
    var int=this.read(8);
    if (int.length!=8) return 0
    var view=new DataView(int.buffer,int.byteOffset);
    return view.getBigUint64(0,this.littleEndian)
  }
  readFloat(){
    var int=this.read(4);
    if(int.length!=4)return 0
    var view=new DataView(int.buffer,int.byteOffset);
    return view.getFloat32(0,this.littleEndian)
    //return int[this.littleEndian?'readFloatLE':'readFloatBE'](0)
  }
  readDouble(){
    var int=this.read(8);
    if(int.length!=8)return 0
    var view=new DataView(int.buffer,int.byteOffset);
    return view.getFloat64(0,this.littleEndian)
    //return int[this.littleEndian?'readDoubleLE':'readDoubleBE'](0)
  }
  readData(size){
    if(size<=0)return Buffer$2.allocUnsafe(0)
    return this.read(size)
  }
  readDataAt(pos,size){
    var current=this.position;
    this.position=pos;
    var data=this.readData(size);
    this.position=current;
    return data
  }
  alignStream(alignment){
    var mod=this.position % alignment;
    if (mod != 0) {
      this.position += alignment - mod;
    }
  }
  readAlignedString(len){
    var string=this.readData(len);
    this.alignStream(4);
    return string
  }
}
class BufferReader$3 extends Reader$1{
  constructor(data){
    super();
    if(!isBuffer(data)){data=Buffer$2.from(data);}
    this.data=data;
    this.position=0;
    this.size=data.length;
  }
  read(length){
    var data=this.data.slice(this.position,this.position+length);
    this.position+=length;
    return data
  }
  seek(pos){
    this.position=pos;
  }
  write(newData){
    this.data=Buffer$2.concat([this.data,Buffer$2.from(newData)]);
    this.size+=newData.length;
  }
}

const utils$1 = ({
  noop: noop$1,delay,delay0,
  timeIter,
  generToFunc: generToFunc$1,
  Buffer:Buffer$2,
  Reader: Reader$1,
  BufferReader: BufferReader$3
});

//base on https://github.com/esterTion/unity-texture-toolkit/blob/master/UnityBundle.php
const { Buffer: Buffer$1, Reader, BufferReader: BufferReader$2 }=utils$1;
const lzma_view=new DataView(new ArrayBuffer(8));
const lzma_uncompress_stream=(data,uncompressedSize)=>{
  lzma_view.setBigInt64(0,BigInt(uncompressedSize),true);
  return lzma.decompressFile(Buffer$1.concat([
    data.slice(0,5),Buffer$1.from(lzma_view.buffer),data.slice(5)
  ]))
};
const lz4_magic=Buffer$1.from('04224d1840700000000000','hex');
const lz4_uncompress_stream=(data,uncompressedSize)=>{
  lz4_magic.writeUInt32LE(data.length,7);
  return Buffer$1.from(lz4.decompress(Buffer$1.concat([lz4_magic,data]),uncompressedSize))
};

class Bundle{
  constructor(bundle){
    var header=this.header=bundle.readStringToNull();
    if(header!='UnityFS'&&header!='UnityRaw'){
      throw new Error('unknown header: '+header)
    }
    var format=this.format=bundle.readInt32();
    this.versionPlayer=bundle.readStringToNull();
    this.versionEngine=bundle.readStringToNull();

    if(format<6){
      bundle.readUint32();
      bundle.readUint16();
      let offset=bundle.readInt16();
      bundle.readUint32();
      let lzmaChunks=bundle.readInt32();
      for(let i=0; i<lzmaChunks; i++) {
        bundle.readInt32();
        bundle.readUint32();
      }
      bundle.position=offset;

      // getFiles
      let fileCount=bundle.readInt32();
      let fileList=new Map();
      for (let i=0; i<fileCount; i++) {
        let filename=bundle.readStringToNull();
        let fileOffset=bundle.readInt32() + offset;
        let fileSize=bundle.readInt32();
        let nextFile=bundle.position;

        bundle.position=fileOffset;
        fileList.set(filename, bundle.readData(fileSize));
        bundle.position=nextFile;
      }
      this.fileList=fileList;
      return
    } else if (format == 6) ; else if (format == 7) ; else {
      throw new Error('unknown version: '+format)
    }

    bundle.readInt64();
    var compressedSize=bundle.readInt32();
    var uncompressedSize=bundle.readInt32();
    var flag=bundle.readInt32();

    if ((flag & 128) != 0) {
      throw new Error('block info at end')
    }else {
      if(format==7){bundle.alignStream(16);}
      var blocksInfoBytes=bundle.readData(compressedSize);
    }

    switch (flag & 63) {
      case 0:// Not compressed
        var uncompressedData=blocksInfoBytes;
        break
      case 1:
        //this.uncompressedData=lzma_uncompress_stream(blocksInfoBytes,uncompressedSize)
        throw new Error('lzma compressed block info')
      case 2:
      case 3:
        uncompressedData=lz4_uncompress_stream(blocksInfoBytes, uncompressedSize);
        break
      default:
        throw new Error('unknown flag')
    }
    var blocksInfo=new BufferReader$2(uncompressedData);
    blocksInfo.seek(16);
    {
      let blockCount=blocksInfo.readInt32();
      let assetsData=[];
      for (let i=0; i<blockCount; i++) {
        let uncompressedSize=blocksInfo.readInt32();
        let compressedSize=blocksInfo.readInt32();
        let flag=blocksInfo.readInt16();

        let chunkData=bundle.readData(compressedSize);
        switch (flag & 63) {
          case 0:// not compressed
            assetsData.push(chunkData);
            break
          case 1:// 7zip
            assetsData.push(lzma_uncompress_stream(chunkData,uncompressedSize));
          case 2:
          case 3:
            assetsData.push(lz4_uncompress_stream(chunkData, uncompressedSize));
        }
      }
      this.assetsData=new BufferReader$2(Buffer$1.concat(assetsData));
    }{
      let entryInfoCount=blocksInfo.readInt32();
      let entryInfos=this.entryInfos=[];
      let offset,size,filename;
      for(let i=0;i<entryInfoCount;i++){
        offset=blocksInfo.readInt64();
        size=blocksInfo.readInt64();
        blocksInfo.readInt32();
        filename=blocksInfo.readStringToNull();
        entryInfos.push({
          offset,
          size,
          filename
        });
      }
    }
  }
  extract(){
    if(this.fileList)return this.fileList
    var fileList=new Map();
    for(var info of this.entryInfos){
      this.assetsData.position=Number(info.offset);
      var file=this.assetsData.readData(Number(info.size));
      fileList.set(info.filename,file);
    }
    return fileList
  }
}

const Bundle$1 = Object.assign(Bundle,{
  Buffer: Buffer$1,lz4,lzma,
  lzma_uncompress_stream,
  lz4_uncompress_stream,
  Reader,
  BufferReader: BufferReader$2
});

//base on https://github.com/Perfare/AssetStudio/tree/master/Texture2DDecoderNative/etc.cpp
const {floor,ceil: ceil$1,max: max$1}=Math;
const create2dArray=(constructor,w,h)=>{
  if(typeof w==='number'){
    const bpe=constructor.BYTES_PER_ELEMENT;
    const buf=new ArrayBuffer(bpe*w*h);
    return Array.from({length:w},(_,i)=>{
      return new constructor(buf,bpe*h*i,h)
    })
  }else {
    let i,h=0;
    for(i=0;i<w.length;i++){h=max$1(h,w[i].length);}
    const bufs=create2dArray(constructor,w.length,h);
    for(i=0;i<bufs.length;i++){bufs[i].set(w[i]);}
    return bufs
  }
};
const WriteOrderTable=new Uint8Array([0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]);
const WriteOrderTableRev=new Uint8Array([15, 11, 7, 3, 14, 10, 6, 2, 13, 9, 5, 1, 12, 8, 4, 0]);
const Etc1ModifierTable=create2dArray(Uint8Array,[
  [ 2, 8],[ 5,17],[ 9, 29],[13, 42],
  [18,60],[24,80],[33,106],[47,183]
]);
const Etc1SubblockTable=create2dArray(Uint8Array,[
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1]
]);
const Etc2DistanceTable=new Uint8Array([3,6,11,16,23,32,41,64]);
const Etc2AlphaModTable=create2dArray(Int8Array,[
  [-3,-6,-9,-15,2,5,8,14],[-3,-7,-10,-13,2,6,9,12],[-2,-5,-8,-13,1,4,7,12],
  [-2,-4,-6,-13,1,3,5,12],[-3,-6, -8,-12,2,5,7,11],[-3,-7,-9,-11,2,6,8,10],
  [-4,-7,-8,-11,3,6,7,10],[-3,-5, -8,-11,2,4,7,10],[-2,-6,-8,-10,1,5,7, 9],
  [-2,-5,-8,-10,1,4,7, 9],[-2,-4, -8,-10,1,3,7, 9],[-2,-5,-7,-10,1,4,6, 9],
  [-3,-4,-7,-10,2,3,6, 9],[-1,-2, -3,-10,0,1,2, 9],[-4,-6,-8, -9,3,5,7, 8],
  [-3,-5,-7,-9,2,4,6,8]
]);
const clampArray=new Uint8ClampedArray(8);
const clampUint32=new Uint32Array(clampArray.buffer);
//const clampView=new DataView(clampArray.buffer)
const clamp=(x)=>{
  return clampArray[0]=x,clampArray[0]
};
const color=(r,g,b,a)=>{
  clampArray[0]=r;clampArray[1]=g;
  clampArray[2]=b;clampArray[3]=a;
  return clampUint32[0]
};
const set_alpha=(c,a)=>{
  clampUint32[0]=c;clampArray[3]=a;
  return clampUint32[0]
};
const applicate_color=(c,m)=>color(c[0]+m,c[1]+m,c[2]+m,255);//u8 c[3],i16 m
const applicate_color_raw=(c)=>color(c[0],c[1],c[2],255);

const etc = ({
  clamp,color,
  set_alpha,
  applicate_color,
  applicate_color_raw,
  create2dArray,
  copy_block_buffer(bx,by,w,h,bw,bh,buffer,image){
    const x=bw*bx,xl=bw*(bx+1)>w?w-bw*bx:bw;
    var buffer_off=buffer.byteOffset;
    const buffer_end=buffer_off+bw*bh*4;
    for (var y=by*bh;buffer_off<buffer_end&&y<h;buffer_off+=bw*4,y++){
      image.set(new Uint32Array(buffer.buffer,buffer_off,xl),y*w+x);
    }
  },
  copy_block_buffer_reverse(bx,by,w,h,bw,bh,buffer,image){
    const x=bw*bx,xl=bw*(bx+1)>w?w-bw*bx:bw;
    var buffer_off=buffer.byteOffset;
    const buffer_end=buffer_off+bw*bh*4;
    for (var y=h-by*bh-1;buffer_off<buffer_end&&y>=0;buffer_off+=bw*4,y--){
      image.set(new Uint32Array(buffer.buffer,buffer_off,xl),y*w+x);
    }
  },
  decode_etc2_block(data,outbuf){//u8 data[8],u32 outbuf[16]
    var j = data[6] << 8 | data[7];  // 15 -> 0
    var k = data[4] << 8 | data[5];  // 31 -> 16
    var c=create2dArray(Uint8Array,3,3);

    if (data[3] & 2) {// diff bit == 1
        var r = data[0] & 0xf8;
        var dr = (data[0] << 3 & 0x18) - (data[0] << 3 & 0x20);
        var g = data[1] & 0xf8;
        var dg = (data[1] << 3 & 0x18) - (data[1] << 3 & 0x20);
        var b = data[2] & 0xf8;
        var db = (data[2] << 3 & 0x18) - (data[2] << 3 & 0x20);
        if (r + dr < 0 || r + dr > 255) {// T
          c[0][0]=(data[0]<<3&0xc0)|(data[0]<<4&0x30)|(data[0] >>1&0xc)|(data[0]&3);
          c[0][1] = (data[1] & 0xf0) | data[1] >> 4;
          c[0][2] = (data[1] & 0x0f) | data[1] << 4;
          c[1][0] = (data[2] & 0xf0) | data[2] >> 4;
          c[1][1] = (data[2] & 0x0f) | data[2] << 4;
          c[1][2] = (data[3] & 0xf0) | data[3] >> 4;
          const d = Etc2DistanceTable[(data[3] >> 1 & 6) | (data[3] & 1)];
          const color_set=[applicate_color_raw(c[0]), applicate_color(c[1], d),
                           applicate_color_raw(c[1]), applicate_color(c[1], -d)];
          k <<= 1;
          for (var i = 0; i < 16; i++, j >>= 1, k >>= 1){
            outbuf[WriteOrderTable[i]] = color_set[(k & 2) | (j & 1)];
          }
        } else if (g + dg < 0 || g + dg > 255) {// H
          c[0][0] = (data[0] << 1 & 0xf0) | (data[0] >> 3 & 0xf);
          c[0][1] = (data[0] << 5 & 0xe0) | (data[1] & 0x10);
          c[0][1] |= c[0][1] >> 4;
          c[0][2] = (data[1] & 8) | (data[1] << 1 & 6) | data[2] >> 7;
          c[0][2] |= c[0][2] << 4;
          c[1][0] = (data[2] << 1 & 0xf0) | (data[2] >> 3 & 0xf);
          c[1][1] = (data[2] << 5 & 0xe0) | (data[3] >> 3 & 0x10);
          c[1][1] |= c[1][1] >> 4;
          c[1][2] = (data[3] << 1 & 0xf0) | (data[3] >> 3 & 0xf);
          var d = (data[3] & 4) | (data[3] << 1 & 2);
          if (c[0][0] > c[1][0] ||
              (c[0][0] == c[1][0] && (c[0][1] > c[1][1] ||
              (c[0][1] == c[1][1] && c[0][2] >= c[1][2])))
            ){++d;}
          d = Etc2DistanceTable[d];
          var color_set=[applicate_color(c[0],d),applicate_color(c[0],-d),
                            applicate_color(c[1],d),applicate_color(c[1],-d)];
          k <<= 1;
          for (var i = 0; i < 16; i++, j >>= 1, k >>= 1){
            outbuf[WriteOrderTable[i]] = color_set[(k & 2) | (j & 1)];
          }
        } else if (b + db < 0 || b + db > 255) {// planar
          c[0][0] = (data[0] << 1 & 0xfc) | (data[0] >> 5 & 3);
          c[0][1] = (data[0] << 7 & 0x80) | (data[1] & 0x7e) | (data[0] & 1);
          c[0][2] = (data[1] << 7 & 0x80) | (data[2] << 2 & 0x60) | (data[2] << 3 & 0x18) | (data[3] >> 5 & 4);
          c[0][2] |= c[0][2] >> 6;
          c[1][0] = (data[3] << 1 & 0xf8) | (data[3] << 2 & 4) | (data[3] >> 5 & 3);
          c[1][1] = (data[4] & 0xfe) | data[4] >> 7;
          c[1][2] = (data[4] << 7 & 0x80) | (data[5] >> 1 & 0x7c);
          c[1][2] |= c[1][2] >> 6;
          c[2][0] = (data[5] << 5 & 0xe0) | (data[6] >> 3 & 0x1c) | (data[5] >> 1 & 3);
          c[2][1] = (data[6] << 3 & 0xf8) | (data[7] >> 5 & 0x6) | (data[6] >> 4 & 1);
          c[2][2] = data[7] << 2 | (data[7] >> 4 & 3);
          for(let y=0,x,i=0;y<4;y++){
            for(x=0;x<4;x++,i++){
              let r = ((x * (c[1][0] - c[0][0]) + y * (c[2][0] - c[0][0]) + 4 * c[0][0] + 2) >> 2);
              let g = ((x * (c[1][1] - c[0][1]) + y * (c[2][1] - c[0][1]) + 4 * c[0][1] + 2) >> 2);
              let b = ((x * (c[1][2] - c[0][2]) + y * (c[2][2] - c[0][2]) + 4 * c[0][2] + 2) >> 2);
              outbuf[i] = color(r, g, b, 255);
            }
          }
        } else {// differential
          const code=[data[3] >> 5, data[3] >> 2 & 7];
          const table=Etc1SubblockTable[data[3] & 1];
          c[0][0] = r | r >> 5;
          c[0][1] = g | g >> 5;
          c[0][2] = b | b >> 5;
          c[1][0] = r + dr;
          c[1][1] = g + dg;
          c[1][2] = b + db;
          c[1][0] |= c[1][0] >> 5;
          c[1][1] |= c[1][1] >> 5;
          c[1][2] |= c[1][2] >> 5;
          for (var i = 0; i < 16; i++, j >>= 1, k >>= 1) {
            let s = table[i];
            let m = Etc1ModifierTable[code[s]][j & 1];
            outbuf[WriteOrderTable[i]] = applicate_color(c[s], k & 1 ? -m : m);
          }
        }
    } else {
      // individual (diff bit == 0)
      const code=[data[3] >> 5, data[3] >> 2 & 7];
      const table=Etc1SubblockTable[data[3] & 1];
      c[0][0] = (data[0] & 0xf0) | data[0] >> 4;
      c[1][0] = (data[0] & 0x0f) | data[0] << 4;
      c[0][1] = (data[1] & 0xf0) | data[1] >> 4;
      c[1][1] = (data[1] & 0x0f) | data[1] << 4;
      c[0][2] = (data[2] & 0xf0) | data[2] >> 4;
      c[1][2] = (data[2] & 0x0f) | data[2] << 4;
      for (var i = 0; i < 16; i++, j >>= 1, k >>= 1) {
        let s = table[i];
        let m = Etc1ModifierTable[code[s]][j & 1];
        outbuf[WriteOrderTable[i]] = applicate_color(c[s], k & 1 ? -m : m);
      }
    }
  },
  decode_etc2a8_block(data,outbuf) {//u8 data[8],u32 outbuf[16]
    if (data[1] & 0xf0) {// multiplier != 0
      const multiplier=data[1]>>4;
      const table=Etc2AlphaModTable[data[1]&0xf];
      var l=new DataView(data.buffer,data.byteOffset,8).getBigUint64(0);
      const l3=BigInt(3),l7=BigInt(7);
      for (var i=0,j;i<16;i++,l>>=l3){
        j=WriteOrderTableRev[i];
        outbuf[j]=set_alpha(outbuf[j],data[0]+multiplier*table[Number(l&l7)]);
      }
    } else {// multiplier == 0 (always same as base codeword)
      for (var i=0;i<16;i++){
        outbuf[i]=set_alpha(outbuf[i],data[0]);
      }
    }
  },
  imgDataToUint32Array(imgData){
    var {data}=imgData;
    return new Uint32Array(data.buffer,data.byteOffset,data.byteLength/4)
  },
  decode_etc2a8(data,imgData,reverse){
    const w=imgData.width,h=imgData.height;
    const num_blocks_x=ceil$1(w/4);//floor((w + 3)/4)
    const num_blocks_y=ceil$1(h/4);//floor((h + 3)/4)
    const buffer=new Uint32Array(16);
    const image=this.imgDataToUint32Array(imgData);
    const copy=reverse?this.copy_block_buffer_reverse:this.copy_block_buffer;
    var data_off=data.byteOffset;
    for(var by=0;by<num_blocks_y;by++){
      for(var bx=0;bx<num_blocks_x;bx++,data_off+=16){
        this.decode_etc2_block(new Uint8Array(data.buffer,data_off+8,8),buffer);
        this.decode_etc2a8_block(new Uint8Array(data.buffer,data_off,8),buffer);
        copy(bx,by,w,h,4,4,buffer,image);
      }
    }
  },
  decode_etc2a8_reverse(data,imgData){
    return this.decode_etc2a8(data,imgData,true)
  }
});

//base on https://github.com/esterTion/unity-texture-toolkit/blob/master/UnityAeest.php
const {Buffer,BufferReader: BufferReader$1}=utils$1;
const hex2bin=hex=>Buffer.from(hex,'hex');
const isset=v=>typeof v!=='undefined';
const empty=v=>!(v&&v.length);
class AssetFile{
  constructor(stream){
    this.stream=stream;
    this.filePath;
    this.fileName;
    this.fileGen;
    this.m_Version='2.5.0f5';
    this.platform=0x6000000;
    this.platformStr='';
    this.baseDefinitions=false;
    this.classIDs=[];
    this.ClassStructures={};
    this.preloadTable=new Map();
    this.buildType;
    this.version;
    this.sharedAssetsList=[];
    this.valid=false;

    try {
      var tableSize=stream.readInt32();
      var dataEnd=stream.readInt32();
      this.fileGen=stream.readInt32();
      var dataOffset=stream.readInt32();
      if (this.fileGen >= 9) {
        var endian=stream.readByte();
        stream.readData(3);
      } else {
        stream.position=dataEnd - tableSize;
        endian=stream.readByte();
      }
      if (this.fileGen >= 22) {
        tableSize=stream.readUint32();
        dataEnd=stream.readInt64();
        dataOffset=stream.readInt64();
        stream.readInt64();
      }
      if (endian===0/* "\0" */) {
        stream.littleEndian=true;
      }

      if (this.fileGen >= 7) {
        this.m_Version=stream.readStringToNull();
      }
      if (this.fileGen >= 8) {
        this.platform=stream.readInt32();
      }
      if (this.fileGen >= 13) {
        this.baseDefinitions=stream.readByte()===1;//"\x01"
      }

      this.platformStr=AssetFile.platforms[this.platform]||AssetFile.platforms['default'];
      

      for (let i=0,baseCount=stream.readInt32(); i<baseCount; i++) {
        if (this.fileGen < 14) {
          throw new Error('fileGen < 14')
        } else {
          this.readSerializedType();
        }
      }
      /* {
        const t2d=this.ClassStructures[28]
        const member=t2d&&t2d.members[5]
        if(member&&member.name==="m_DownscaleFallback"){
          t2d.members.splice(6,0,{
            'level':member.level,
            'type':'int',
            'name':'!!stupid!!',
            'size':4,
            'flag':0
          })
        }
      } */
      if (this.fileGen >= 7 && this.fileGen < 14) {
        stream.position += 4;
      }
      var assetCount=stream.readInt32();
      var assetIDfmt='%0'+String(assetCount).length+'d';
      for(var i=0; i<assetCount; i++) {
        if (this.fileGen >= 14) {
          stream.alignStream(4);
        }
        var asset=new AssetPreloadData();
        asset.m_PathID=this.fileGen<14 ? stream.readInt32() : stream.readInt64();
        asset.offset=this.fileGen<22 ? stream.readUint32() : stream.readInt64();
        asset.offset += dataOffset;
        asset.size=stream.readInt32();
        if (this.fileGen > 15) {
          var index=stream.readInt32();
          asset.type1=this.classIDs[index][0];
          asset.type2=this.classIDs[index][1];
        } else {
          asset.type1=stream.readInt32();
          asset.type2=stream.readUint16();
          stream.position += 2;
        }
        if (this.fileGen==15) {
          stream.readByte();
        }
        asset.typeString=AssetFile.classIDReference[asset.type2]||'Unknown Type '+asset.type2;
        asset.uniqueID=i;//sprintf(assetIDfmt, i)
        asset.fullSize=asset.size;
        asset.sourceFile=this;
        this.preloadTable.set(asset.m_PathID,asset);
        /*
        should not met this type
        if (asset.type2==141 && this.fileGen==6) {
          throw new Exception('old gen file')
        }*/
      }
      this.buildType=this.m_Version.replace(/\d/g,'').split('.');
      this.version=this.m_Version.replace(/\D/g,'.').split('.');
      if(this.version[0]==2&&this.version[1]==0&&this.version[2]==1&&this.version[3]==7){
        this.version.splice(0,4,2017);
      }

      if (this.fileGen >= 14) {
        var someCount=stream.readInt32();
        for (var i=0; i<someCount; i++) {
          stream.readInt32();
          stream.alignStream(4);
          stream.readInt64();
        }
      }

      var sharedFileCount=stream.readInt32();
      for (var i=0; i<sharedFileCount; i++) {
        var shared={};
        shared.name=stream.readStringToNull();
        stream.position += 20;
        sharedFileName=stream.readStringToNull();
        shared.fileName=sharedFileName;
        shared.index=i;
        this.sharedAssetsList.push(shared);
      }
      this.valid=true;
    }catch(e){this.error=e;}
  }
  readSerializedType(){
    var stream=this.stream;
    var classID=stream.readInt32();
    if (this.fileGen > 15) {
      stream.readData(1);
      if ((type=stream.readInt16()) >= 0) {
        type=-1 - type;
      } else {
        var type=classID;
      }
      this.classIDs.push([type, classID]);
      if (classID==114) {
        stream.position += 16;
      }
      classID=type;
    } else if (classID < 0) {
      stream.position += 16;
    }
    stream.position += 16;
    if (this.baseDefinitions) {
      var nodeInfoSize=24;
      if (this.fileGen >= 19) {
        nodeInfoSize += 8;
      }
      var varCount=stream.readInt32();
      var stringSize=stream.readInt32();
      stream.position += varCount * nodeInfoSize;
      var stringReader=new BufferReader$1(stringSize?stream.readData(stringSize):'');
      var className='';
      var classVar=[];
      stream.position -= varCount * nodeInfoSize + stringSize;
      for (var i=0; i<varCount; i++) {
        stream.readInt16();
        var level=stream.readByte();
        stream.readBoolean();

        var varTypeIndex=stream.readInt16();
        if (stream.readInt16()==0) {
          stringReader.seek(varTypeIndex);
          var varTypeStr=stringReader.readStringToNull();
        } else {
          varTypeStr=isset(AssetFile.baseStrings[varTypeIndex]) ? AssetFile.baseStrings[varTypeIndex] : varTypeIndex;
        }

        var varNameIndex=stream.readInt16();
        if (stream.readInt16()==0) {
          stringReader.seek(varNameIndex);
          var varNameStr=stringReader.readStringToNull();
        } else {
          varNameStr=isset(AssetFile.baseStrings[varNameIndex]) ? AssetFile.baseStrings[varNameIndex] : varTypeIndex;
        }

        var size=stream.readInt32();
        var flag2=stream.readInt32() != 0;
        var flag=stream.readInt32();
        if (this.fileGen >= 19) {
          stream.ulonglong;
        }
        if (!flag2) {
          className=varTypeStr + ' ' + varNameStr;
        } else {
          classVar.push({
            'level':level -1,
            'type':varTypeStr,
            'name':varNameStr,
            'size':size,
            'flag':flag
          });
        }
      }
      stream.position += stringSize;
      var aClass={
        'ID':classID,
        'text':className,
        'members':classVar
      };
      //aClass.SubItems.Add(classID.ToString())
      this.ClassStructures[classID]=aClass;

      if (this.fileGen >= 21) {
        arrSize=stream.long;
        stream.position += arrSize * 4;
      }
    }
  }
}
AssetFile.platforms={
  [-2]:'Unity Package',
  4: 'OSX',
  5: 'PC',
  6: 'Web',
  7: 'Web streamed',
  9: 'iOS',
  10:'PS3',
  11:'Xbox 360',
  13:'Android',
  16:'Google NaCl',
  19:'CollabPreview',
  21:'WP8',
  25:'Linux',
  29:'Wii U',
  'default':'Unknown Platform'
};
AssetFile.baseStrings={
  0:"AABB",
  5:"AnimationClip",
  19:"AnimationCurve",
  34:"AnimationState",
  49:"Array",
  55:"Base",
  60:"BitField",
  69:"bitset",
  76:"bool",
  81:"char",
  86:"ColorRGBA",
  96:"Component",
  106:"data",
  111:"deque",
  117:"double",
  124:"dynamic_array",
  138:"FastPropertyName",
  155:"first",
  161:"float",
  167:"Font",
  172:"GameObject",
  183:"Generic Mono",
  196:"GradientNEW",
  208:"GUID",
  213:"GUIStyle",
  222:"int",
  226:"list",
  231:"long long",
  241:"map",
  245:"Matrix4x4f",
  256:"MdFour",
  263:"MonoBehaviour",
  277:"MonoScript",
  288:"m_ByteSize",
  299:"m_Curve",
  307:"m_EditorClassIdentifier",
  331:"m_EditorHideFlags",
  349:"m_Enabled",
  359:"m_ExtensionPtr",
  374:"m_GameObject",
  387:"m_Index",
  395:"m_IsArray",
  405:"m_IsStatic",
  416:"m_MetaFlag",
  427:"m_Name",
  434:"m_ObjectHideFlags",
  452:"m_PrefabInternal",
  469:"m_PrefabParentObject",
  490:"m_Script",
  499:"m_StaticEditorFlags",
  519:"m_Type",
  526:"m_Version",
  536:"Object",
  543:"pair",
  548:"PPtr<Component>",
  564:"PPtr<GameObject>",
  581:"PPtr<Material>",
  596:"PPtr<MonoBehaviour>",
  616:"PPtr<MonoScript>",
  633:"PPtr<Object>",
  646:"PPtr<Prefab>",
  659:"PPtr<Sprite>",
  672:"PPtr<TextAsset>",
  688:"PPtr<Texture>",
  702:"PPtr<Texture2D>",
  718:"PPtr<Transform>",
  734:"Prefab",
  741:"Quaternionf",
  753:"Rectf",
  759:"RectInt",
  767:"RectOffset",
  778:"second",
  785:"set",
  789:"short",
  795:"size",
  800:"SInt16",
  807:"SInt32",
  814:"SInt64",
  821:"SInt8",
  827:"staticvector",
  840:"string",
  847:"TextAsset",
  857:"TextMesh",
  866:"Texture",
  874:"Texture2D",
  884:"Transform",
  894:"TypelessData",
  907:"UInt16",
  914:"UInt32",
  921:"UInt64",
  928:"UInt8",
  934:"unsigned int",
  947:"unsigned long long",
  966:"unsigned short",
  981:"vector",
  988:"Vector2f",
  997:"Vector3f",
  1006:"Vector4f",
  1015:"m_ScriptingClassIdentifier",
  1042:"Gradient",
  1051:"Type*"
};
AssetFile.classIDReference={
  1:"GameObject",
  2:"Component",
  3:"LevelGameManager",
  4:"Transform",
  5:"TimeManager",
  6:"GlobalGameManager",
  8:"Behaviour",
  9:"GameManager",
  11:"AudioManager",
  12:"ParticleAnimator",
  13:"InputManager",
  15:"EllipsoidParticleEmitter",
  17:"Pipeline",
  18:"EditorExtension",
  19:"Physics2DSettings",
  20:"Camera",
  21:"Material",
  23:"MeshRenderer",
  25:"Renderer",
  26:"ParticleRenderer",
  27:"Texture",
  28:"Texture2D",
  29:"SceneSettings",
  30:"GraphicsSettings",
  33:"MeshFilter",
  41:"OcclusionPortal",
  43:"Mesh",
  45:"Skybox",
  47:"QualitySettings",
  48:"Shader",
  49:"TextAsset",
  50:"Rigidbody2D",
  51:"Physics2DManager",
  53:"Collider2D",
  54:"Rigidbody",
  55:"PhysicsManager",
  56:"Collider",
  57:"Joint",
  58:"CircleCollider2D",
  59:"HingeJoint",
  60:"PolygonCollider2D",
  61:"BoxCollider2D",
  62:"PhysicsMaterial2D",
  64:"MeshCollider",
  65:"BoxCollider",
  66:"SpriteCollider2D",
  68:"EdgeCollider2D",
  70:"CapsuleCollider2D",
  72:"ComputeShader",
  74:"AnimationClip",
  75:"ConstantForce",
  76:"WorldParticleCollider",
  78:"TagManager",
  81:"AudioListener",
  82:"AudioSource",
  83:"AudioClip",
  84:"RenderTexture",
  86:"CustomRenderTexture",
  87:"MeshParticleEmitter",
  88:"ParticleEmitter",
  89:"Cubemap",
  90:"Avatar",
  91:"AnimatorController",
  92:"GUILayer",
  93:"RuntimeAnimatorController",
  94:"ScriptMapper",
  95:"Animator",
  96:"TrailRenderer",
  98:"DelayedCallManager",
  102:"TextMesh",
  104:"RenderSettings",
  108:"Light",
  109:"CGProgram",
  110:"BaseAnimationTrack",
  111:"Animation",
  114:"MonoBehaviour",
  115:"MonoScript",
  116:"MonoManager",
  117:"Texture3D",
  118:"NewAnimationTrack",
  119:"Projector",
  120:"LineRenderer",
  121:"Flare",
  122:"Halo",
  123:"LensFlare",
  124:"FlareLayer",
  125:"HaloLayer",
  126:"NavMeshAreas",
  127:"HaloManager",
  128:"Font",
  129:"PlayerSettings",
  130:"NamedObject",
  131:"GUITexture",
  132:"GUIText",
  133:"GUIElement",
  134:"PhysicMaterial",
  135:"SphereCollider",
  136:"CapsuleCollider",
  137:"SkinnedMeshRenderer",
  138:"FixedJoint",
  140:"RaycastCollider",
  141:"BuildSettings",
  142:"AssetBundle",
  143:"CharacterController",
  144:"CharacterJoint",
  145:"SpringJoint",
  146:"WheelCollider",
  147:"ResourceManager",
  148:"NetworkView",
  149:"NetworkManager",
  150:"PreloadData",
  152:"MovieTexture",
  153:"ConfigurableJoint",
  154:"TerrainCollider",
  155:"MasterServerInterface",
  156:"TerrainData",
  157:"LightmapSettings",
  158:"WebCamTexture",
  159:"EditorSettings",
  160:"InteractiveCloth",
  161:"ClothRenderer",
  162:"EditorUserSettings",
  163:"SkinnedCloth",
  164:"AudioReverbFilter",
  165:"AudioHighPassFilter",
  166:"AudioChorusFilter",
  167:"AudioReverbZone",
  168:"AudioEchoFilter",
  169:"AudioLowPassFilter",
  170:"AudioDistortionFilter",
  171:"SparseTexture",
  180:"AudioBehaviour",
  181:"AudioFilter",
  182:"WindZone",
  183:"Cloth",
  184:"SubstanceArchive",
  185:"ProceduralMaterial",
  186:"ProceduralTexture",
  187:"Texture2DArray",
  188:"CubemapArray",
  191:"OffMeshLink",
  192:"OcclusionArea",
  193:"Tree",
  194:"NavMeshObsolete",
  195:"NavMeshAgent",
  196:"NavMeshSettings",
  197:"LightProbesLegacy",
  198:"ParticleSystem",
  199:"ParticleSystemRenderer",
  200:"ShaderVariantCollection",
  205:"LODGroup",
  206:"BlendTree",
  207:"Motion",
  208:"NavMeshObstacle",
  210:"TerrainInstance",
  212:"SpriteRenderer",
  213:"Sprite",
  214:"CachedSpriteAtlas",
  215:"ReflectionProbe",
  216:"ReflectionProbes",
  218:"Terrain",
  220:"LightProbeGroup",
  221:"AnimatorOverrideController",
  222:"CanvasRenderer",
  223:"Canvas",
  224:"RectTransform",
  225:"CanvasGroup",
  226:"BillboardAsset",
  227:"BillboardRenderer",
  228:"SpeedTreeWindAsset",
  229:"AnchoredJoint2D",
  230:"Joint2D",
  231:"SpringJoint2D",
  232:"DistanceJoint2D",
  233:"HingeJoint2D",
  234:"SliderJoint2D",
  235:"WheelJoint2D",
  236:"ClusterInputManager",
  237:"BaseVideoTexture",
  238:"NavMeshData",
  240:"AudioMixer",
  241:"AudioMixerController",
  243:"AudioMixerGroupController",
  244:"AudioMixerEffectController",
  245:"AudioMixerSnapshotController",
  246:"PhysicsUpdateBehaviour2D",
  247:"ConstantForce2D",
  248:"Effector2D",
  249:"AreaEffector2D",
  250:"PointEffector2D",
  251:"PlatformEffector2D",
  252:"SurfaceEffector2D",
  253:"BuoyancyEffector2D",
  254:"RelativeJoint2D",
  255:"FixedJoint2D",
  256:"FrictionJoint2D",
  257:"TargetJoint2D",
  258:"LightProbes",
  259:"LightProbeProxyVolume",
  271:"SampleClip",
  272:"AudioMixerSnapshot",
  273:"AudioMixerGroup",
  280:"NScreenBridge",
  290:"AssetBundleManifest",
  292:"UnityAdsManager",
  300:"RuntimeInitializeOnLoadManager",
  301:"CloudWebServicesManager",
  303:"UnityAnalyticsManager",
  304:"CrashReportManager",
  305:"PerformanceReportingManager",
  310:"UnityConnectSettings",
  319:"AvatarMask",
  328:"VideoPlayer",
  329:"VideoClip",
  363:"OcclusionCullingData",
  1001:"Prefab",
  1002:"EditorExtensionImpl",
  1003:"AssetImporter",
  1004:"AssetDatabase",
  1005:"Mesh3DSImporter",
  1006:"TextureImporter",
  1007:"ShaderImporter",
  1008:"ComputeShaderImporter",
  1011:"AvatarMask",
  1020:"AudioImporter",
  1026:"HierarchyState",
  1027:"GUIDSerializer",
  1028:"AssetMetaData",
  1029:"DefaultAsset",
  1030:"DefaultImporter",
  1031:"TextScriptImporter",
  1032:"SceneAsset",
  1034:"NativeFormatImporter",
  1035:"MonoImporter",
  1037:"AssetServerCache",
  1038:"LibraryAssetImporter",
  1040:"ModelImporter",
  1041:"FBXImporter",
  1042:"TrueTypeFontImporter",
  1044:"MovieImporter",
  1045:"EditorBuildSettings",
  1046:"DDSImporter",
  1048:"InspectorExpandedState",
  1049:"AnnotationManager",
  1050:"PluginImporter",
  1051:"EditorUserBuildSettings",
  1052:"PVRImporter",
  1053:"ASTCImporter",
  1054:"KTXImporter",
  1101:"AnimatorStateTransition",
  1102:"AnimatorState",
  1105:"HumanTemplate",
  1107:"AnimatorStateMachine",
  1108:"PreviewAssetType",
  1109:"AnimatorTransition",
  1110:"SpeedTreeImporter",
  1111:"AnimatorTransitionBase",
  1112:"SubstanceImporter",
  1113:"LightmapParameters",
  1120:"LightmapSnapshot",
  367388927:"SubDerived",
  334799969:"SiblingDerived",
  687078895:"SpriteAtlas",
  1091556383:"Derived",
  1480428607:"LowerResBlitTexture",
  1571458007:"RenderPassAttachment"
};

class AssetPreloadData{
  /* m_PathID
  offset
  size
  type1
  type2
  typeString
  fullSize
  infoText
  extension
  sourceFile
  uniqueID */
}

class Asset{
  constructor(preloadData){
    var sourceFile=preloadData.sourceFile;
    var stream=sourceFile.stream;
    stream.position=preloadData.offset;
    if (sourceFile.platform==-2) {
      throw new Error('no support')
    }
  }
}
class Mesh$2 extends Asset{
  constructor(preloadData){
    super(preloadData);
    var {sourceFile}=preloadData;
    var {stream}=sourceFile;
    var {members}=sourceFile.ClassStructures[43];
    var struct0=this.struct0=ClassStructHelper.DeserializeStruct(stream,members);
    var struct=this.struct=ClassStructHelper.OrganizeStruct(struct0);
    this.data=new Float32Array(new Uint8Array(struct.m_VertexData.m_DataSize).buffer);
  }
  *toObjx(){
    for(var [line] of (this.data.join(',')+',').matchAll(/(?:[^,]+,){5}/g)){
      line=line.split(',',5);
      yield `v ${line.slice(0,3).join(' ')}`;
      yield `vt ${line.slice(3,5).join(' ')}`;
    }
  }
  toObj(){
    return Array.from(this.toObjx()).join('\n')
  }
}
class Texture2D extends Asset{
  constructor(preloadData, readSwitch) {
    super(preloadData);
    this.dwFlags=4103;
    this.dwCaps=4096;
    this.mipMap=false;
    var {sourceFile}=preloadData;
    var {stream}=sourceFile;
    
    var {members}=sourceFile.ClassStructures[28];
    var struct0=this.struct0=ClassStructHelper.DeserializeStruct(stream,members);
    var struct=this.struct=ClassStructHelper.OrganizeStruct(struct0);
    this.name=struct['m_Name'];
    this.width=struct['m_Width'];
    this.height=struct['m_Height'];
    this.completeImageSize=struct['m_CompleteImageSize'];
    this.textureFormat=struct['m_TextureFormat'];
    this.imageCount=struct['m_ImageCount'];
    this.textureDimension=struct['m_TextureDimension'];
    if(struct['image data']!=null&&struct['image data'].length){
      this.imageData=struct['image data'];
      this.imageDataSize=this.imageData.length;
    }else if(struct['m_StreamData']!=null){
      this.offset=struct['m_StreamData']['offset'];
      this.imageDataSize=struct['m_StreamData']['size'];
      this.path=struct['m_StreamData']['path'];
      if(readSwitch!=null){
        if(this.path){
          const path=this.path.replace(/archive:\/[^/]+\//,'');
          const buf=readSwitch.get(path);
          if(buf!=null){
            const reader=new BufferReader$1(Buffer.from(buf));
            reader.position=this.offset;
            this.imageData=reader.readData(this.imageDataSize);
          }else {
            throw new Error('require resource not found: '+this.path)
          }
        }else {
          this.imageData=stream.readData(this.imageDataSize);
        }
      }
    }
    this.textureFormatStr=TextureFormatMap[this.textureFormat];
    switch(this.textureFormat){
      case TextureFormat.ASTC_RGBA_4x4:
      case TextureFormat.ASTC_RGB_5x5:
      case TextureFormat.ASTC_RGB_6x6:
      case TextureFormat.ASTC_RGB_8x8:
      case TextureFormat.ASTC_RGB_10x10:
      case TextureFormat.ASTC_RGB_12x12:
      case TextureFormat.ASTC_RGBA_4x4:
      case TextureFormat.ASTC_RGBA_5x5:
      case TextureFormat.ASTC_RGBA_6x6:
      case TextureFormat.ASTC_RGBA_8x8:
      case TextureFormat.ASTC_RGBA_10x10:
      case TextureFormat.ASTC_RGBA_12x12:
        this.outputMethod='astcenc';
        break
      case TextureFormat.RGBA32:
      case TextureFormat.ARGB32:
        this.outputMethod='bmp';
        this.bitDepth=32;
        break
      case TextureFormat.RGB24:
        this.outputMethod='bmp';
        this.bitDepth=24;
        break
      case TextureFormat.ETC2_RGBA8:
        this.outputMethod='etc2a8';
        this.bitDepth=32;
        break
      /* case TextureFormat.RGBA4444:
      case TextureFormat.RGB565:
        this.outputMethod='bmp'
        this.bitDepth=16
        break */
      case TextureFormat.PVRTC_RGB4:
        this.outputMethod='pvr';
        break
      default:
        this.outputMethod='not implemented: '+this.textureFormat+' '+this.textureFormatStr;
    }
  }
  swapRgbBmp(data,format=this.textureFormat){
    const REG_RGB24=/([\x00-\xff])([\x00-\xff])([\x00-\xff])/g;
    const REG_RGB32=/([\x00-\xff])([\x00-\xff])([\x00-\xff])([\x00-\xff])/g;
    data=data||this.imageData;
    var reg,str;
    if(format==TextureFormat.RGB24){
      reg=REG_RGB24,str="$3$2$1\xff";
    }else if(format==TextureFormat.RGBA32){
      reg=REG_RGB32,str='$3$2$1$4';
    }else if(format==TextureFormat.ARGB32){
      reg=REG_RGB32,str='$4$3$2$1';
    }
    if(reg&&str){
      data=Array.from(data,v=>String.fromCharCode(v)).join('');
      data=data.replace(reg,str);
      return Buffer.from(data,'ascii')
    }
    if(format==TextureFormat.RGB565){
      let len=data.length,out=Buffer.alloc(len*2,0xff);
      for(let i=0;i<len;i+=2){
        pxl=data[i]+data[i+1]*256;
        r=(pxl & 0xf800) >> 8;
        out[i*2+2]=r | ((r & 0xe0) >> 5);
        g=(pxl & 0x7e0) >> 3;
        out[i*2+1]=g | ((g & 0xb0) >> 6);
        b=(pxl & 0x1f) << 3;
        out[i*2  ]=b | ((b & 0xe0) >> 5);
      }
      return out
    }else if(format==TextureFormat.RGBA4444){
      let len=data.length,out=Buffer.alloc(len*2,0xff);
      for(let i=0;i<len;i+=2){
        pxl=data[i]+data[i+1]*256;
        r=(pxl & 0xf000) >> 8;
        out[i*2+2]=r | (r >> 4);
        g=(pxl &  0xf00) >> 8;
        out[i*2+1]=g | (g >> 4);
        b=(pxl &   0xf0);
        out[i*2  ]=b | (b >> 4);
        a=(pxl &    0xf);
        out[i*2+3]=a | (a << 4);
      }
      return out
    }
    throw new Error(this.outputMethod+' not supported')
  }
  swapRgbPng(data,format=this.textureFormat){
    throw new Error(this.outputMethod+' not supported')
  }
  toBlob(){
    if(this.outputMethod==='astcenc'){
      return new Blob([
        hex2bin('13ABA15C'),
        Buffer.from({
          48 :"0404",
          49 :"0505",
          50 :"0606",
          51 :"0808",
          52 :"0a0a",
          53 :"0c0c",
          54 :"0404",
          55 :"0505",
          56 :"0606",
          57 :"0808",
          58 :"0a0a",
          59 :"0c0c",
        }[this.textureFormat]+"01",'hex'),
        substr(pack('V', this.width), 0, 3),
        substr(pack('V', this.height), 0, 3),
        hex2bin('010000'),
        this.imageData
      ],{type:'image/astc'})
    }else if(this.outputMethod==='bmp'){
      const pack=(i)=>{
        var buf=Buffer.allocUnsafe(4);
        buf.writeUInt32LE(i,0);
        return buf
      };
      const {width,height}=this;
      return new Blob([
        Buffer.from('BM','ascii'),
        pack((this.imageData.length)*32/this.bitDepth+54),
        hex2bin('0000000036000000'),
        // DIB header
        hex2bin('28000000'),//header size
        pack(width),
        pack(height),
        hex2bin('0100'),//channel
        hex2bin('2000'),//bitdepth
        hex2bin('00000000'),//compression
        pack((this.imageData.length)*32/this.bitDepth),
        hex2bin('00000000000000000000000000000000'),
        //hoz resolution + ver resolution + color num + important color num
        swapRGB(this.textureFormat, this.imageData)
      ],{type:'image/bmp'})
    }else if (this.outputMethod==='pvr'){
      return new Blob([this.imageData],{type:'image/pvr'})
    }
    throw new Error(this.outputMethod+' not supported')
  }
  toImageData(){
    if(this.outputMethod==='bmp'){
      let data=this.imageData,format=this.textureFormat;
      let w=this.width,h=this.height,r,g,b,a;
      if(format==TextureFormat.RGBA32){
        r=0,g=1,b=2,a=3;
      }else if(format==TextureFormat.ARGB32){
        a=0,r=1,g=2,b=3;
      }
      if(g&&b){
        const outData=new ImageData(w,h),out=outData.data;
        for(let i=0;i<h;i++){
          for(let j=0;j<w;j++){
            let left=i*w*4+j*4,right=(h-i-1)*w*4+j*4;
            out[left+0]=data[right+r];
            out[left+1]=data[right+g];
            out[left+2]=data[right+b];
            out[left+3]=data[right+a];
          }
        }
        return outData
      }
    }else if(this.outputMethod==='etc2a8'){
      const w=this.width,h=this.height;
      const imgData=new ImageData(w,h);
      etc.decode_etc2a8_reverse(this.imageData,imgData);
      return imgData
    }
    throw new Error(this.outputMethod+' not supported')
  }
  createCtx(width=this.width,height=this.height){
    if(Texture2D.hasOffscreenCanvas||typeof Texture2D.hasOffscreenCanvas==='undefined'){
      try{
        const c=new OffscreenCanvas(width,height);
        const ctx=c.getContext("2d");
        Texture2D.hasOffscreenCanvas=true;
        return ctx
      }catch(e){
        Texture2D.hasOffscreenCanvas=false;
      }
    }
    const c=document.createElement('canvas');
    c.width=width;c.height=height;
    return c.getContext("2d")
  }
  toPNG(){
    const img=this.toImageData();
    const ctx=this.createCtx();
    ctx.putImageData(img,0,0);
    return new Promise(ok=>{
      ctx.canvas.toBlob(ok,'image/png');
    })
  }
}
class TextAsset extends Asset{
  constructor(preloadData,readSwitch){
    super(preloadData);
    var sourceFile=preloadData.sourceFile;
    var stream=sourceFile.stream;
    if (sourceFile.platform==-2) {
      stream.readUint32();
      throw new Error('platform -2')
    }
    this.name=stream.readAlignedString(stream.long);
    if (readSwitch) {
      this.data=stream.readData(stream.long);
    }
  }
}
const TextureFormatMap={
   1 :'Alpha8',
   2 :'ARGB4444',
   3 :'RGB24',
   4 :'RGBA32',
   5 :'ARGB32',
   7 :'RGB565',
   9 :'R16',
  10 :'DXT1',
  12 :'DXT5',
  13 :'RGBA4444',
  14 :'BGRA32',
  15 :'RHalf',
  16 :'RGHalf',
  17 :'RGBAHalf',
  18 :'RFloat',
  19 :'RGFloat',
  20 :'RGBAFloat',
  21 :'YUY2',
  22 :'RGB9e5Float',
  26 :'BC4',
  27 :'BC5',
  24 :'BC6H',
  25 :'BC7',
  28 :'DXT1Crunched',
  29 :'DXT5Crunched',
  30 :'PVRTC_RGB2',
  31 :'PVRTC_RGBA2',
  32 :'PVRTC_RGB4',
  33 :'PVRTC_RGBA4',
  34 :'ETC_RGB4',
  35 :'ATC_RGB4',
  36 :'ATC_RGBA8',
  41 :'EAC_R',
  42 :'EAC_R_SIGNED',
  43 :'EAC_RG',
  44 :'EAC_RG_SIGNED',
  45 :'ETC2_RGB',
  46 :'ETC2_RGBA1',
  47 :'ETC2_RGBA8',
  48 :'ASTC_RGB_4x4',
  49 :'ASTC_RGB_5x5',
  50 :'ASTC_RGB_6x6',
  51 :'ASTC_RGB_8x8',
  52 :'ASTC_RGB_10x10',
  53 :'ASTC_RGB_12x12',
  54 :'ASTC_RGBA_4x4',
  55 :'ASTC_RGBA_5x5',
  56 :'ASTC_RGBA_6x6',
  57 :'ASTC_RGBA_8x8',
  58 :'ASTC_RGBA_10x10',
  59 :'ASTC_RGBA_12x12',
  60 :'ETC_RGB4_3DS',
  61 :'ETC_RGBA8_3DS',
  62 :'RG16',
  63 :'R8',
  64 :'ETC_RGB4Crunched',
  65 :'ETC2_RGBA8Crunched'
};
const reverseMap=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[v,Number(k)]));
const TextureFormat=reverseMap(TextureFormatMap);
Object.assign(Texture2D,{
  etc,
  formatMap:TextureFormatMap,
  format:TextureFormat
});
const {round,pow,ceil,log10,abs: abs$1}=Math;
const ClassStructHelper={
  roundSigDigs(number,sigdigs){
    var ori=number;
    var power=ori==0?0:ceil(log10(abs$1(number)));
    number*=pow(10, sigdigs-power);
    return round(number)*pow(10, power-sigdigs)
  },
  DeserializeStruct(stream, members) {
    var output=[];
    for (var i=0; i<members.length;i++){
      var member=members[i];
      var name=member['name'];
      var type=member['type'];
      var level=member['level'];
      var align=(member['flag'] & 16384) != 0;
      var value={
        'level' :level,
        'name' :name,
        'type' :type,
        'value' :null
      };
      if (isset(member['alignBefore'])) {
        stream.alignStream(4);
      }
      switch (type) {
        case 'SInt8': {
          value['value']=stream.readByte();
          if (value['value'] >= 128) value['value']=value['value'] - 256;
          break
        }
        case 'UInt8': {
          value['value']=stream.readByte();
          break
        }
        case 'SInt16': case 'short': {
          value['value']=stream.short;
          break
        }
        case 'UInt16': case 'unsigned short': {
          value['value']=stream.ushort;
          break
        }
        case 'SInt32': case 'int': {
          value['value']=stream.readInt32();
          break
        }
        case 'UInt32': case 'unsigned int': case 'Type*': {
          value['value']=stream.readUint32();
          break
        }
        case 'SInt64': case 'long long': {
          value['value']=stream.readInt64();
          break
        }
        case 'UInt64': case 'unsigned long long': {
          value['value']=stream.readUint64();
          break
        }
        case 'float': {
          value['value']=stream.readFloat();//roundSigDigs(,7)
          break
        }
        case 'double': {
          value['value']=stream.readDouble();//roundSigDigs(,14)
          break
        }
        case 'bool': {
          value['value']=stream.readBoolean();
          break
        }
        case 'string': {
          value['value']=stream.readAlignedString(stream.readInt32()).toString();
          i += 3;
          break
        }
        case 'Array': {
          align=false;
          if ((members[i - 1]['flag'] & 16384) != 0) align=true;
          value['size']=stream.readInt32();
          var arr=ClassStructHelper.ReadArray(members, level, i);
          var dataArr=[];
          for (var j=0; j<value['size']; j++) {
            dataArr.push(ClassStructHelper.DeserializeStruct(stream, arr));
          }
          i += arr.length + 1;
          value['value']=dataArr;
          break
        }
        case 'TypelessData': {
          var size2=stream.readInt32();
          value['value']=stream.readData(size2);
          i+=2;
          break
        }
        default: {
          if (align) {
            align=false;
            ClassStructHelper.SetAlignBefore(members, level, i + 1);
          }
        }
      }
      if(align){
        stream.alignStream(4);
      }
      output.push(value);
    }
    return output
  },
  ReadArray(members,level,index){
    var member2=[];
    for(var i=index+2;i<members.length;i++){
      var member3=members[i];
      if(member3['level'] <= level)return member2
      member2.push(member3);
    }
    return member2
  },
  SetAlignBefore(members,level,index){
    for(var i=index;i<members.length;i++){
      var member=members[i];
      if(member['level']<=level){
        member['alignBefore']=true;
        return
      }
    }
  },
  OrganizeStruct(deserializedStruct, level=0) {
    var currentLevel={};
    var subLevels=[];
    var lastMember=[{}];
    
    for(var member of deserializedStruct) {
      if (member['level']==level) {
        if (!empty(subLevels)) {
          lastMember[0][lastMember[1]]=ClassStructHelper.OrganizeStruct(subLevels, level + 1);
          subLevels=[];
        }
        currentLevel[member['name']]=member['value'];
        lastMember=[currentLevel, member['name']];
      } else if (member['level'] > level) {
        if (member['type']==='Array' && !isset(member['arrProcessed'])) {
          member['arrProcessed']=true;
          var arrLevel=member['level'];
          member['value']=member['value'].map(function (i){
            return ClassStructHelper.OrganizeStruct(i, arrLevel + 1)
          });
        }
        subLevels.push(member);
      }
    }
    if(!empty(subLevels)){
      lastMember[0][lastMember[1]]=ClassStructHelper.OrganizeStruct(subLevels, level + 1);
    }
    var keys=Object.keys(currentLevel);
    if(keys.length==1&&keys[0]=='Array'){
      currentLevel=currentLevel['Array'];
    }
    return currentLevel
  }
};

const Asset$1 = Object.assign(Asset,{
  utils: utils$1,
  Bundle:Bundle$1,
  File:AssetFile,
  PreloadData:AssetPreloadData,
  Mesh: Mesh$2,
  Texture2D,
  TextAsset,
  ClassStructHelper
});

const tag=obj=>obj[Symbol.toStringTag];
  const asyncIterToArray=async(it)=>{
    const arr=[];
    for await(var value of it){
      arr.push(value);
    }
    return arr
  };
  const asyncEntriesToMap=async(it)=>{
    const map=new Map();
    for await(var [key,value] of it){
      map.set(key,value);
    }
    return map
  };
  const {abs,max,min}=Math;
  const {apply}=Function.prototype,noop=()=>{};
  const drawImg=apply.bind(CanvasRenderingContext2D.prototype.drawImage);
  class Mesh$1{
    static parseMesh1(mesh){
      const v=[],vt=[];
      var width=0,height=0,x,y;
      for(var line of mesh.split('\n')){
        line=line.trim().split(' ');
        if(line[0]==='v'){
          x=abs(line[1]),y=abs(line[2]);
          width=max(width,x),height=max(height,y);
          v.push([x,y]);
        }else if(line[0]==='vt'){
          x=abs(line[1]),y=abs(line[2]);
          vt.push([x,y]);
        }
      }
      return {
        v,vt,width,height
      }
    }
    static*parseMesh2(opts,img){
      var {v,vt,height}=opts;
      var img_w=img.naturalWidth ||img.width;
      var img_h=img.naturalHeight||img.height;
      for(var i=0,j=2;i<v.length;i+=4,j+=4){
        var src_x=vt[i][0]*img_w      ,src_y=(1-vt[j][1])*img_h;
        var src_w=vt[j][0]*img_w-src_x,src_h=(1-vt[i][1])*img_h-src_y;
        var dst_x=v[i][0]      ,dst_y=height-v[j][1];
        var dst_w=v[j][0]-dst_x,dst_h=height-v[i][1]-dst_y;
        yield [img,
          src_x,src_y,src_w,src_h,
          dst_x,dst_y,dst_w,dst_h
        ];
      }
    }
    static from(mesh,img){
      var opts=this.parseMesh1(mesh);
      var slices=Array.from(this.parseMesh2(opts,img));
      var that=new this(opts.width,opts.height,slices);
      return that
    }
    static fromImg(img){
      return new this(img.width,img.height,[[
        img,0,0,img.width,img.height,0,0,img.width,img.height
      ]])
    }
    static async fromBundle(bundle,onprogress){
      var pe=new this.PantingExtracter(),that;
      await pe.readAsync(bundle,onprogress||noop);
      var img=await createImageBitmap(pe.imageData);
      if(pe.meshText){
        that=this.from(pe.meshText,img);
      }else {
        that=this.fromImg(img);
      }
      that.textureMethod=pe.texture.outputMethod;
      if(typeof WeakRef==='function'){
        that.pantingExtracterWeak=new WeakRef(pe);
      }
      return that
    }
    constructor(width,height,slices){
      this.width=width,this.height=height;
      this.slices=slices;
    }
    setCanvasSize(canvas){
      canvas.width=this.width,canvas.height=this.height;
    }
    draw(ctx){
      if(ctx.nodeName==="CANVAS"){ctx=ctx.getContext('2d');}
      for(var args of this.slices){
        drawImg(ctx,args);
      }
    }
    drawOutline(ctx){
      if(ctx.nodeName==="CANVAS"){ctx=ctx.getContext('2d');}
      ctx.strokeStyle='#FF0000';
      ctx.lineWidth=1;
      ctx.beginPath();
      for(var args of this.slices){
        ctx.rect(args[5]+0.5,args[6]+0.5,args[7]-1,args[8]-1);
      }
      ctx.stroke();
    }
    drawDump(ctx){
      if(ctx.nodeName==="CANVAS"){ctx=ctx.getContext('2d');}
      var img=this.slices[0][0];
      ctx.canvas.width=img.width,ctx.canvas.height=img.height;
      ctx.drawImage(img,0,0);
      ctx.strokeStyle='#FF0000';
      ctx.lineWidth=1;
      ctx.beginPath();
      for(var args of this.slices){
        ctx.rect(args[1]+0.5,args[2]+0.5,args[3]-1,args[4]-1);
      }
      ctx.stroke();
    }
  }
  const PNG_RE=/^([\s\S]+)\.png$/,PNG_EXT='.png',MESH_EXT='-mesh.obj';
  const BUNDLE_RE=/^([\s\S]+)\_tex$/;
  class MeshFileLoader{
    static fromList(list){
      const pngs=new Map();
      const files=new Map();
      const meshs=new Map();
      const bundles=new Map();
      for(var file of list){
        var {name}=file,m;
        if(m=name.match(PNG_RE)){
          pngs.set(m[1],file);
        }else if(m=name.match(BUNDLE_RE)){
          bundles.set(name,file);
        }else {
          files.set(name,file);
        }
      }
      for(var name of Array.from(pngs.keys())){
        var mesh=files.get(name+MESH_EXT);
        if(mesh){
          meshs.set(name,mesh);
        }else {
          pngs.delete(name);
        }
      }
      var that=new this(pngs,meshs);
      that.bundles=bundles;
      return that
    }
    constructor(pngs,meshs){
      this.pngs=pngs;
      this.meshs=meshs;
    }
    async*entries(onprogress){
      const {pngs,meshs,bundles}=this;
      onprogress=onprogress||noop;
      var i=0,size=pngs.size+(bundles?bundles.size:0);
      for(var name of pngs.keys()){
        onprogress({i:i++,size,name});
        var img=pngs.get(name);
        if(tag(img)==='FileSystemFileHandle'){
          img=await img.getFile();
        }
        var mesh=meshs.get(name);
        if(tag(mesh)==='FileSystemFileHandle'){
          mesh=await mesh.getFile();
        }
        if(tag(img)==='File'&&tag(mesh)==='File'){
          mesh=mesh.text();
          img=createImageBitmap(img);
          yield [name,Mesh$1.from(await mesh,await img)];
        }
      }
      if(!Mesh$1.PantingExtracter)return
      for(var name of bundles?bundles.keys():[]){
        var file=bundles.get(name);
        if(tag(file)==='FileSystemFileHandle'){
          file=await file.getFile();
        }
        yield [name,await Mesh$1.fromBundle(await file.arrayBuffer(),(stat)=>{
          onprogress({
            i:i+stat.i/stat.size,size,
            name:name+' '+stat.name,
            time:stat.time
          });
          //{i,size,name,time}
        })];
        i++;
      }
    }
  }
  MeshFileLoader.prototype[Symbol.asyncIterator]=MeshFileLoader.prototype.entries;
  class MeshFsHandleLoader{
    static async from(dir){
      try{
        const dir1=await dir.getDirectoryHandle('Texture2D');
        const dir2=await dir.getDirectoryHandle('Mesh');
        return new this(dir1,dir2)
      }catch(err){
        if(err.name==='NotFoundError'
          ||err.name==='TypeMismatchError'){
          return new this(dir,dir)
        }
        throw err
      }
    }
    constructor(dir1,dir2){
      this.dir1=dir1;
      this.dir2=dir2;
      this.keysPromise=asyncIterToArray(this.keys());
    }
    async get(name){
      const {dir1,dir2}=this;
      try{
        var img=await dir1.getFileHandle(name+PNG_EXT);
        var mesh=await dir2.getFileHandle(name+MESH_EXT);
        mesh=mesh.getFile().then(file=>file.text());
        img=img.getFile().then(createImageBitmap);
        return Mesh$1.from(await mesh,await img)
      }catch(err){
        if(err.name==='NotFoundError'){return}
        if(err.name==='TypeMismatchError'){return}
        throw err
      }
    }
    async*keys(){
      for await(var name of this.dir1.keys()){
        var m=name.match(PNG_RE);
        if(m=m&&m[1]){yield m;}
      }
    }
    async*entries(onprogress){
      const keys=await this.keysPromise;
      var i=0,size=keys.length;
      onprogress=onprogress||noop;
      for(var name of keys){
        onprogress({i:i++,size,name});
        var mesh=await this.get(name);
        if(mesh){yield [name,mesh];}
      }
    }
  }
  MeshFsHandleLoader.prototype[Symbol.asyncIterator]=MeshFsHandleLoader.prototype.entries;
  Object.assign(Mesh$1,{
    PNG_RE,PNG_EXT,MESH_EXT,BUNDLE_RE,
    drawImg,
    FileLoader:MeshFileLoader,
    FsHandleLoader:MeshFsHandleLoader
  });
  const utils = ({
    tag,asyncIterToArray,asyncEntriesToMap,Mesh: Mesh$1,
    xhr:url=>new Promise((resolve,reject,xhr)=>{
      xhr=new XMLHttpRequest();
      xhr.open('GET',url);
      xhr.onload=e=>{
        xhr.status===200?resolve(xhr.responseText):reject(e);
      };
      xhr.onerror=reject;
      xhr.responseType='text';
      //xhr.withCredentials=true
      xhr.send();
    }),
    loadImage:src=>new Promise((ok,reject,img)=>{
      img=new Image(),img.src=src;
      const onload=e=>{
        img.removeEventListener('load',onload);
        img.removeEventListener('error',onload);
        e.type==='load'?ok(img):reject(e);
      };
      img.addEventListener('load',onload);
      img.addEventListener('error',onload);
    }),
    writeFile:async(handle,name,data)=>{
      if(true!==name){
        handle=await handle.getFileHandle(name,{create:true});
      }
      const writable=await handle.createWritable();
      await writable.write(data);
      await writable.close();
    }
  });

/**
 * @createDate 2021年10月5日, 星期二，下午 8:23:34
 */

const { Mesh, xhr, loadImage, writeFile } = utils;
const { generToFunc, BufferReader } = Asset$1.utils;
class PantingExtracter {
  *xread(buf) {
    var i = 0, size = 4;
    yield { i: i++, size, name: 'Bundle' };
    this.bundle = new Asset$1.Bundle(new BufferReader(buf));
    const assetMap = this.bundle.extract();
    for (var name of assetMap.keys()) {
      if (name.endsWith('.resS')) { continue }
      //.resS file is external data storage file
      break
    }
    yield { i: i++, size, name: 'Asset' };
    this.asset = new Asset$1.File(new BufferReader(assetMap.get(name)));
    this.texture = this.mesh = null;
    for (const item of this.asset.preloadTable.values()) {
      const name = item.typeString;
      if (name === 'Texture2D' && !this.texture) {
        yield { i: i++, size, name };
        this.texture = new Asset$1.Texture2D(item, assetMap);// Parse and read data
        this.imageData = this.texture.toImageData();
      } else if (name === 'Mesh' && !this.mesh) {
        yield { i: i++, size, name };
        this.mesh = new Asset$1.Mesh(item);
        this.meshText = this.mesh.toObj();
      }
    }
    yield { i: i++, size, name: 'complete' };
  }
}
Mesh.PantingExtracter = PantingExtracter;
generToFunc(PantingExtracter.prototype, 'read');

const { LoadingBar, Row, Col, Checkbox, Button, ButtonGroup, Cell, CellGroup } = iview;
const id = 'sorter';
const createProcesser = (name, cb) => {
  return async function () {
    if (this.progress) { return }
    try {
      this.progress = name;
      //await delay(100)
      await cb.apply(this, arguments);
      LoadingBar.finish();
    } catch (err) {
      if (err.name === 'AbortError') {
        iview.Message.warning('已取消');
      } else {
        LoadingBar.error();
        iview.Message.error('发生错误');
        throw err
      }
    } finally {
      this.progress = null;
    }
  }
};
const name = 'Asset Linear Sliceing Sorter';
const vm = new Vue({
  name,
  data() {
    return {
      progress: null,
      curMeshName: null,
      meshMap: null
    }
  },
  computed: {
    curMesh() {
      const name = this.curMeshName;
      return this.meshMap && this.meshMap.get(name)
    }
  },
  methods: {
    handleDragover(e) {
      e.preventDefault(); e.stopPropagation();
    },
    handleDrop: createProcesser('drop', async function (e) {
      e.preventDefault(); e.stopPropagation();
      const vm = this, files = Array.from(e.dataTransfer.files);
      if (this.hasFSAccess) {
        for (const item of e.dataTransfer.items) {
          if (item.kind !== 'file') { continue }
          const entry = await item.getAsFileSystemHandle();
          if (entry.kind !== 'directory') { continue }
          vm.handle = entry;
          var it = await Mesh.FsHandleLoader.from(vm.handle);
          break
        }
      }
      if (it == null) { it = Mesh.FileLoader.fromList(files); }
      const map = vm.meshMap = new Map();
      for await (var [key, mesh] of it.entries((stat) => {
        LoadingBar.update(100 * stat.i / stat.size);
      })) {
        map.set(key, mesh);
        var weak = mesh.pantingExtracterWeak;
        if (weak) {
          vm.lastPantingExtracter = weak.deref();
        }
        if (map.size === 1) { vm.draw(key); }
        vm.$forceUpdate();
      }
    }),
    handleOpen: createProcesser('open', async function (e) {
      const vm = this, el = e && e.target;
      if (el && e.type === 'change' && el.tagName === "INPUT") {
        it = Mesh.FileLoader.fromList(el.files);
      } else if (!vm.hasFSAccess) {
        const el = document.createElement('input');
        el.type = 'file'; el.multiple = true;
        el.onchange = vm.handleOpen;
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
      } else {
        const fileHandles = await showOpenFilePicker({
          id, multiple: true,
          /* types:[{
            description: 'Images & Meshs',
            accept:{
              'image/png':'.png','text/plain+mesh':'.obj',
              'text/*':'.Unity3D'
            }
          }] */
        });
        it = Mesh.FileLoader.fromList(fileHandles);
      }
      if (it) {
        var map = vm.meshMap = new Map(), it;
        for await (var [key, mesh] of it.entries((stat) => {
          LoadingBar.update(100 * stat.i / stat.size);
        })) {
          map.set(key, mesh);
          var weak = mesh.pantingExtracterWeak;
          if (weak) {
            vm.lastPantingExtracter = weak.deref();
          }
          if (map.size === 1) { vm.draw(key); }
          vm.$forceUpdate();
        }
      }
    }),
    handleOpenDir: createProcesser('open-dir', async function () {
      const vm = this;
      vm.handle = await window.showDirectoryPicker({ id });
      const it = await Mesh.FsHandleLoader.from(vm.handle);
      const map = vm.meshMap = new Map();
      for await (var [key, value] of it.entries((stat) => {
        LoadingBar.update(100 * stat.i / stat.size);
      })) {
        map.set(key, value);
        if (map.size === 1) { vm.draw(key); }
        vm.$forceUpdate();
      }
    }),
    handleExports: createProcesser('exports', async function () {
      const vm = this, { canvas } = vm.$refs;
      const blob = new Promise(ok => { canvas.toBlob(ok, 'image/png'); });
      const name = vm.curMeshName + '.png';
      if (vm.hasFSAccess) {
        const handle = await showSaveFilePicker({
          id,
          types: [{
            description: 'PNG',
            accept: { 'image/png': '.png' }
          }],
          suggestedName: name
        });
        await writeFile(handle, true, await blob);
        return
      }
      const link = document.createElement('a');
      const dataURL = URL.createObjectURL(await blob);
      link.href = dataURL;
      link.download = name;
      link.style.display = 'none';
      document.body.append(link);
      link.click(); link.remove();
      URL.revokeObjectURL(dataURL);
    }),
    handleExportsDir: createProcesser('exports-dir', async function () {
      const vm = this, { canvas } = vm.$refs;
      if (vm.handle) {
        handle = await vm.handle.getDirectoryHandle('exports', { create: true });
      } else {
        var handle = await window.showDirectoryPicker({ id });
      }
      var prev = Promise.resolve();
      var i = 0, len = vm.meshMap.size + 1;
      for (var name of vm.meshMap.keys()) {
        const fileName = name + '.png';
        try {
          throw new DOMException('', 'NotFoundError')
          await handle.getFileHandle(fileName);
        } catch (err) {
          if (err.name !== 'NotFoundError') { throw err }
          vm.draw(name);
          var blob = await new Promise(ok => { canvas.toBlob(ok, 'image/png'); });
          await prev;
          prev = writeFile(handle, fileName, blob);
        }
        LoadingBar.update(100 * ++i / len);
      }
      await prev;
    }),
    handleViewer() {
      const vm = this;
      vm.$refs.canvas.toBlob(blob => {
        var src = URL.createObjectURL(blob);
        var img = new Image();
        img.src = src;
        var viewer = vm.viewer = new Viewer(img, {
          hidden() {
            URL.revokeObjectURL(src);
            viewer.destroy();
            vm.viewer = null;
          }
        });
        viewer.show();
      }, 'image/png');
    },
    draw(name) {
      const vm = this, { canvas } = vm.$refs;
      if (typeof name === 'string') { vm.curMeshName = name; }
      const mesh = vm.curMesh;
      if (!mesh) { return }
      mesh.setCanvasSize(canvas);
      const ctx = canvas.getContext("2d");
      mesh.draw(ctx);
      if (vm.hasOutline) {
        mesh.drawOutline(ctx);
      }
    },
    drawDump() {
      const vm = this;
      vm.curMesh.drawDump(vm.$refs.canvas);
    }
  },
  created() {
    this.hasFSAccess = 'showOpenFilePicker' in window;
  },
  async mounted() {
    const vm = this, el = vm.$el, doc = el.ownerDocument;
    doc.title = name;
    doc.addEventListener('dragover', vm.handleDragover);
    doc.addEventListener('drop', vm.handleDrop);
    vm.$watch('hasOutline', vm.draw);
  },
  render() {
    const vm = this, { _c, _v, _e, hasFSAccess, progress, meshMap } = this;
    const disabled = !!progress, hasMeshMap = meshMap && meshMap.size;
    return _c('div', {
      staticClass: "container", attrs: { id: "app" }
    }, [
      _c(Row, { attrs: { gutter: 5 } }, [
        _c(Col, { attrs: { span: 4 } }, [_v(' ')]),
        _c(Col, { attrs: { span: 20 } }, [
          _c(ButtonGroup, { staticStyle: { margin: '5px' } }, [
            _c(Button, {
              attrs: { disabled },
              on: { click: vm.handleOpen }
            }, [_v('打开')]),
            _c(Button, {
              attrs: { disabled: !hasFSAccess || disabled },
              on: { click: vm.handleOpenDir }
            }, [_v('打开文件夹')]),
            _c(Button, {
              attrs: { disabled: disabled || !hasMeshMap },
              on: { click: vm.handleExports }
            }, [_v('导出')]),
            _c(Button, {
              attrs: { disabled: !hasFSAccess || disabled || !hasMeshMap },
              on: { click: vm.handleExportsDir },
            }, [_v('批量导出')])
          ]),
          _c(Checkbox, { ref: 'hasOutline' }, [_v('显示轮廓')])
        ])
      ]),
      _c(Row, { attrs: { gutter: 5 } }, [
        _c(Col, {
          attrs: { span: 4 },
        }, [
          _c(CellGroup, {
            staticStyle: {
              'min-height': '100%',
              border: '5px solid #adadad',
              'border-bottom': 0
            },
            on: { 'on-click': vm.draw },
          }, vm.meshMap ? Array.from(vm.meshMap.keys(), (name) => {
            return _c(Cell, {
              attrs: {
                name, title: name, disabled,
                selected: vm.curMeshName === name
              }
            })
          }) : [])
        ]),
        _c(Col, { attrs: { span: 20 }, }, [
          _c('canvas', {
            ref: 'canvas',
            staticClass: 'transparent',
            staticStyle: {
              'text-align': 'center',
              margin: 'auto',
              'width': '100%',
              //'max-height':'100%',
              border: '5px solid #adadad',
            },
            on: { click: vm.handleViewer }
          })
        ])
      ]),
    ])
  }
});
var def = (vm, key) => {
  Object.defineProperty(vm, key, {
    enumerable: true,
    configurable: true,
    get() { return this.$refs[key].currentValue },
    set(value) { this.$refs[key].currentValue = value; }
  });
};
def(vm, 'hasOutline');
try {
  vm.$mount('#app');
  Object.assign(vm, {
    utils, Asset: Asset$1
  });
  Object.assign(window, {
    Vue, iview, Viewer, vm
  });
} catch (e) {
  var el = document.getElementById('nuxt-loading');
  if (el) { el.classList.add('error'); }
  throw e
}
