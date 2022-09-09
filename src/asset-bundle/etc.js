//base on https://github.com/Perfare/AssetStudio/tree/master/Texture2DDecoderNative/etc.cpp
const {floor,ceil,max}=Math
const create2dArray=(constructor,w,h)=>{
  if(typeof w==='number'){
    const bpe=constructor.BYTES_PER_ELEMENT
    const buf=new ArrayBuffer(bpe*w*h)
    return Array.from({length:w},(_,i)=>{
      return new constructor(buf,bpe*h*i,h)
    })
  }else{
    let i,h=0
    for(i=0;i<w.length;i++){h=max(h,w[i].length)}
    const bufs=create2dArray(constructor,w.length,h)
    for(i=0;i<bufs.length;i++){bufs[i].set(w[i])}
    return bufs
  }
}
const WriteOrderTable=new Uint8Array([0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15])
const WriteOrderTableRev=new Uint8Array([15, 11, 7, 3, 14, 10, 6, 2, 13, 9, 5, 1, 12, 8, 4, 0])
const Etc1ModifierTable=create2dArray(Uint8Array,[
  [ 2, 8],[ 5,17],[ 9, 29],[13, 42],
  [18,60],[24,80],[33,106],[47,183]
])
const Etc1SubblockTable=create2dArray(Uint8Array,[
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1]
])
const Etc2DistanceTable=new Uint8Array([3,6,11,16,23,32,41,64])
const Etc2AlphaModTable=create2dArray(Int8Array,[
  [-3,-6,-9,-15,2,5,8,14],[-3,-7,-10,-13,2,6,9,12],[-2,-5,-8,-13,1,4,7,12],
  [-2,-4,-6,-13,1,3,5,12],[-3,-6, -8,-12,2,5,7,11],[-3,-7,-9,-11,2,6,8,10],
  [-4,-7,-8,-11,3,6,7,10],[-3,-5, -8,-11,2,4,7,10],[-2,-6,-8,-10,1,5,7, 9],
  [-2,-5,-8,-10,1,4,7, 9],[-2,-4, -8,-10,1,3,7, 9],[-2,-5,-7,-10,1,4,6, 9],
  [-3,-4,-7,-10,2,3,6, 9],[-1,-2, -3,-10,0,1,2, 9],[-4,-6,-8, -9,3,5,7, 8],
  [-3,-5,-7,-9,2,4,6,8]
])
const clampArray=new Uint8ClampedArray(8)
const clampUint32=new Uint32Array(clampArray.buffer)
//const clampView=new DataView(clampArray.buffer)
const clamp=(x)=>{
  return clampArray[0]=x,clampArray[0]
}
const color=(r,g,b,a)=>{
  clampArray[0]=r;clampArray[1]=g
  clampArray[2]=b;clampArray[3]=a
  return clampUint32[0]
}
const set_alpha=(c,a)=>{
  clampUint32[0]=c;clampArray[3]=a
  return clampUint32[0]
}
const applicate_color=(c,m)=>color(c[0]+m,c[1]+m,c[2]+m,255)//u8 c[3],i16 m
const applicate_color_raw=(c)=>color(c[0],c[1],c[2],255)

export default({
  clamp,color,
  set_alpha,
  applicate_color,
  applicate_color_raw,
  create2dArray,
  copy_block_buffer(bx,by,w,h,bw,bh,buffer,image){
    const x=bw*bx,xl=bw*(bx+1)>w?w-bw*bx:bw
    var buffer_off=buffer.byteOffset
    const buffer_end=buffer_off+bw*bh*4
    for (var y=by*bh;buffer_off<buffer_end&&y<h;buffer_off+=bw*4,y++){
      image.set(new Uint32Array(buffer.buffer,buffer_off,xl),y*w+x)
    }
  },
  copy_block_buffer_reverse(bx,by,w,h,bw,bh,buffer,image){
    const x=bw*bx,xl=bw*(bx+1)>w?w-bw*bx:bw
    var buffer_off=buffer.byteOffset
    const buffer_end=buffer_off+bw*bh*4
    for (var y=h-by*bh-1;buffer_off<buffer_end&&y>=0;buffer_off+=bw*4,y--){
      image.set(new Uint32Array(buffer.buffer,buffer_off,xl),y*w+x)
    }
  },
  decode_etc2_block(data,outbuf){//u8 data[8],u32 outbuf[16]
    var j = data[6] << 8 | data[7];  // 15 -> 0
    var k = data[4] << 8 | data[5];  // 31 -> 16
    var c=create2dArray(Uint8Array,3,3)

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
                           applicate_color_raw(c[1]), applicate_color(c[1], -d)]
          k <<= 1;
          for (var i = 0; i < 16; i++, j >>= 1, k >>= 1){
            outbuf[WriteOrderTable[i]] = color_set[(k & 2) | (j & 1)]
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
            ){++d}
          d = Etc2DistanceTable[d];
          var color_set=[applicate_color(c[0],d),applicate_color(c[0],-d),
                            applicate_color(c[1],d),applicate_color(c[1],-d)]
          k <<= 1;
          for (var i = 0; i < 16; i++, j >>= 1, k >>= 1){
            outbuf[WriteOrderTable[i]] = color_set[(k & 2) | (j & 1)]
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
          const code=[data[3] >> 5, data[3] >> 2 & 7]
          const table=Etc1SubblockTable[data[3] & 1]
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
      const code=[data[3] >> 5, data[3] >> 2 & 7]
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
      var l=new DataView(data.buffer,data.byteOffset,8).getBigUint64(0)
      const l3=BigInt(3),l7=BigInt(7)
      for (var i=0,j;i<16;i++,l>>=l3){
        j=WriteOrderTableRev[i]
        outbuf[j]=set_alpha(outbuf[j],data[0]+multiplier*table[Number(l&l7)])
      }
    } else {// multiplier == 0 (always same as base codeword)
      for (var i=0;i<16;i++){
        outbuf[i]=set_alpha(outbuf[i],data[0])
      }
    }
  },
  imgDataToUint32Array(imgData){
    var {data}=imgData
    return new Uint32Array(data.buffer,data.byteOffset,data.byteLength/4)
  },
  decode_etc2a8(data,imgData,reverse){
    const w=imgData.width,h=imgData.height
    const num_blocks_x=ceil(w/4)//floor((w + 3)/4)
    const num_blocks_y=ceil(h/4)//floor((h + 3)/4)
    const buffer=new Uint32Array(16)
    const image=this.imgDataToUint32Array(imgData)
    const copy=reverse?this.copy_block_buffer_reverse:this.copy_block_buffer
    var data_off=data.byteOffset
    for(var by=0;by<num_blocks_y;by++){
      for(var bx=0;bx<num_blocks_x;bx++,data_off+=16){
        this.decode_etc2_block(new Uint8Array(data.buffer,data_off+8,8),buffer)
        this.decode_etc2a8_block(new Uint8Array(data.buffer,data_off,8),buffer)
        copy(bx,by,w,h,4,4,buffer,image)
      }
    }
  },
  decode_etc2a8_reverse(data,imgData){
    return this.decode_etc2a8(data,imgData,true)
  }
})