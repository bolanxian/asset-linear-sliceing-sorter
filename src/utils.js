
import Asset from './asset-bundle/asset'
import utils from './asset-bundle/utils'

const tag = obj => obj[Symbol.toStringTag]
const asyncIterToArray = async (it) => {
  const arr = []
  for await (const value of it) {
    arr.push(value)
  }
  return arr
}
const asyncEntriesToMap = async (it) => {
  const map = new Map()
  for await (const [key, value] of it) {
    map.set(key, value)
  }
  return map
}

const { abs, max, min } = Math
const { apply } = Function.prototype, noop = () => { }
const drawImg = apply.bind(CanvasRenderingContext2D.prototype.drawImage)
class Mesh {
  static parseMesh0(mesh) {
    if (!mesh.startsWith('%YAML')) { return mesh }
    const m = mesh.match(/^\s*_typelessdata\:\s*(.*?)$/m)
    const inst = Object.create(Asset.Mesh.prototype)
    inst.data = new Float32Array(utils.Buffer.from(m[1], 'hex').buffer)
    return inst.toObj()
  }
  static parseMesh1(mesh) {
    const v = [], vt = []
    var width = 0, height = 0, x, y
    for (var line of mesh.split('\n')) {
      line = line.trim().split(' ')
      if (line[0] === 'v') {
        x = abs(line[1]), y = abs(line[2])
        width = max(width, x), height = max(height, y)
        v.push([x, y]);
      } else if (line[0] === 'vt') {
        x = abs(line[1]), y = abs(line[2])
        vt.push([x, y])
      }
    }
    return {
      v, vt, width, height
    }
  }
  static *parseMesh2(opts, img) {
    var { v, vt, height } = opts
    var img_w = img.naturalWidth || img.width
    var img_h = img.naturalHeight || img.height
    for (var i = 0, j = 2; i < v.length; i += 4, j += 4) {
      var src_x = vt[i][0] * img_w, src_y = (1 - vt[j][1]) * img_h
      var src_w = vt[j][0] * img_w - src_x, src_h = (1 - vt[i][1]) * img_h - src_y
      var dst_x = v[i][0], dst_y = height - v[j][1]
      var dst_w = v[j][0] - dst_x, dst_h = height - v[i][1] - dst_y
      yield [img,
        src_x, src_y, src_w, src_h,
        dst_x, dst_y, dst_w, dst_h
      ]
    }
  }
  static async fromFile(mesh, img) {
    return this.from(...await Promise.all([
      mesh.text(),
      createImageBitmap(img)
    ]))
  }
  static from(mesh, img) {
    var opts = this.parseMesh1(this.parseMesh0(mesh))
    var slices = Array.from(this.parseMesh2(opts, img))
    var that = new this(opts.width, opts.height, slices)
    return that
  }
  static fromImg(img) {
    return new this(img.width, img.height, [[
      img, 0, 0, img.width, img.height, 0, 0, img.width, img.height
    ]])
  }
  static async fromBundle(bundle, onprogress) {
    var pe = new this.PantingExtracter(), that
    await pe.readAsync(bundle, onprogress || noop)
    var img = await createImageBitmap(pe.imageData)
    if (pe.meshText) {
      that = this.from(pe.meshText, img)
    } else {
      that = this.fromImg(img)
    }
    that.textureMethod = pe.texture.outputMethod
    if (typeof WeakRef === 'function') {
      that.pantingExtracterWeak = new WeakRef(pe)
    }
    return that
  }
  constructor(width, height, slices) {
    this.width = width, this.height = height
    this.slices = slices
  }
  setCanvasSize(canvas) {
    canvas.width = this.width, canvas.height = this.height
  }
  draw(ctx) {
    if (ctx.nodeName === "CANVAS") { ctx = ctx.getContext('2d') }
    for (var args of this.slices) {
      drawImg(ctx, args)
    }
  }
  drawOutline(ctx) {
    if (ctx.nodeName === "CANVAS") { ctx = ctx.getContext('2d') }
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (var args of this.slices) {
      ctx.rect(args[5] + 0.5, args[6] + 0.5, args[7] - 1, args[8] - 1)
    }
    ctx.stroke()
  }
  drawDump(ctx) {
    if (ctx.nodeName === "CANVAS") { ctx = ctx.getContext('2d') }
    var img = this.slices[0][0]
    ctx.canvas.width = img.width, ctx.canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (var args of this.slices) {
      ctx.rect(args[1] + 0.5, args[2] + 0.5, args[3] - 1, args[4] - 1)
    }
    ctx.stroke()
  }
}
const PNG_EXT = '.png', MESH_EXT = '-mesh.obj', BUNDLE_EXT = '_tex'
const MESH_INFO_EXT = '-mesh.asset'
class MeshFileLoader {
  static fromDataTransfer(dT) {
    if (typeof DataTransferItem.prototype.getAsFileSystemHandle === 'function') {
      return this.fromDataTransferItemHandleList(dT.items)
    }
    if (typeof DataTransferItem.prototype.webkitGetAsEntry === 'function') {
      return this.fromDataTransferItemEntryList(dT.items)
    }
    return this.fromFileList(dT.files)
  }
  static async*genDataTransferItemToEntry(items) {
    for (const item of items) {
      if (item.kind !== 'file') { continue }
      const entry = item.webkitGetAsEntry()
      if (entry.isFile) {
        yield new Promise((ok, rej) => { entry.file(ok, rej) })
      } else if (entry.isDirectory) {
        const entries = await new Promise((ok, rej) => {
          entry.createReader().readEntries(ok, rej)
        })
        for (const entry of entries) {
          if (entry.isFile) {
            yield new Promise((ok, rej) => { entry.file(ok, rej) })
          }
        }
      }
    }
  }
  static async fromDataTransferItemEntryList(items) {
    return this.fromFileList(await asyncIterToArray(this.genDataTransferItemToEntry(items)))
  }
  static *genDataTransferItemToHandle(items) {
    for (const item of items) {
      if (item.kind !== 'file') { continue }
      yield item.getAsFileSystemHandle()
    }
  }
  static async fromDataTransferItemHandleList(items) {
    return this.fromFsHandleList(this.genDataTransferItemToHandle(items))
  }
  static async*genFsHandleToFsFileHandle(handleList) {
    for await (const handle of handleList) {
      const { kind } = handle
      if (kind === 'file') {
        yield handle
      } else if (kind === 'directory') {
        for await (const value of handle.values()) {
          const { kind } = value
          if (kind === 'file') {
            yield value
          }
        }
      }
    }
  }
  static async fromFsHandleList(handleList) {
    return this.fromFsFileHandleList(await asyncIterToArray(this.genFsHandleToFsFileHandle(handleList)))
  }
  static *genFsFileHandleToFile(it) {
    for (const fileHandle of it) {
      yield fileHandle.getFile()
    }
  }
  static async fromFsFileHandleList(list) {
    return this.fromFileList(await Promise.all(this.genFsFileHandleToFile(list)))
  }
  static fromFileList(list) {
    const that = new this()
    const { pngs, meshs, bundles } = that
    const files = new Map()
    for (const file of list) {
      const { name } = file
      if (name.endsWith(PNG_EXT)) {
        pngs.set(name.slice(0, -PNG_EXT.length), file)
      } else if (name.endsWith(BUNDLE_EXT)) {
        bundles.set(name, file)
      } else if (name.endsWith(MESH_EXT)) {
        files.set(name, file)
      } else if (name.endsWith(MESH_INFO_EXT)) {
        files.set(name, file)
      }
    }
    for (const name of Array.from(pngs.keys())) {
      let mesh
      if ((mesh = files.get(`${name}${MESH_EXT}`)) != null) {
        meshs.set(name, mesh)
      } else if ((mesh = files.get(`${name}${MESH_INFO_EXT}`)) != null) {
        meshs.set(name, mesh)
      } else {
        pngs.delete(name)
      }
    }
    return that
  }
  constructor() {
    this.pngs = new Map()
    this.meshs = new Map()
    this.bundles = new Map()
  }
  async*entries(onprogress = noop) {
    const { pngs, meshs, bundles } = this
    var i = 0, size = pngs.size + (bundles ? bundles.size : 0)
    for (const name of pngs.keys()) {
      onprogress({ i: i++, size, name })
      yield [name, await Mesh.fromFile(meshs.get(name), pngs.get(name))]
    }
    if (Mesh.PantingExtracter == null) return
    for (const name of bundles != null ? bundles.keys() : []) {
      yield [name, await Mesh.fromBundle(await bundles.get(name).arrayBuffer(), (stat) => {
        onprogress({
          i: i + stat.i / stat.size, size,
          name: name + ' ' + stat.name,
          time: stat.time
        })
        //{i,size,name,time}
      })]
      i++
    }
  }
}
MeshFileLoader.prototype[Symbol.asyncIterator] = MeshFileLoader.prototype.entries
class MeshFsHandleLoader {
  static async from(dir) {
    try {
      const dir1 = await dir.getDirectoryHandle('Texture2D')
      const dir2 = await dir.getDirectoryHandle('Mesh')
      return new this(dir1, dir2)
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'TypeMismatchError') {
        return new this(dir, dir)
      }
      throw err
    }
  }
  constructor(dir1, dir2) {
    this.dir1 = dir1
    this.dir2 = dir2
    this.keysPromise = asyncIterToArray(this.keys())
  }
  async get(name) {
    const { dir1, dir2 } = this
    try {
      var img = await dir1.getFileHandle(name + PNG_EXT)
      var mesh = await dir2.getFileHandle(name + MESH_EXT)
      return Mesh.fromFile(await mesh.getFile(), await img.getFile())
    } catch (err) {
      if (err.name === 'NotFoundError') { return }
      if (err.name === 'TypeMismatchError') { return }
      throw err
    }
  }
  async*keys() {
    for await (var name of this.dir1.keys()) {
      if (name.endsWith(PNG_EXT)) {
        yield name.slice(0, -PNG_EXT.length)
      }
    }
  }
  async*entries(onprogress) {
    const keys = await this.keysPromise
    var i = 0, size = keys.length
    onprogress = onprogress || noop
    for (const name of keys) {
      onprogress({ i: i++, size, name })
      const mesh = await this.get(name)
      if (mesh != null) { yield [name, mesh] }
    }
  }
}
MeshFsHandleLoader.prototype[Symbol.asyncIterator] = MeshFsHandleLoader.prototype.entries
Object.assign(Mesh, {
  PNG_EXT, MESH_EXT, BUNDLE_EXT,
  drawImg,
  FileLoader: MeshFileLoader,
  FsHandleLoader: MeshFsHandleLoader
})
export default ({
  tag, asyncIterToArray, asyncEntriesToMap, Mesh,
  xhr: url => new Promise((resolve, reject, xhr) => {
    xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = e => {
      xhr.status === 200 ? resolve(xhr.responseText) : reject(e)
    }
    xhr.onerror = reject
    xhr.responseType = 'text'
    //xhr.withCredentials=true
    xhr.send()
  }),
  loadImage: src => new Promise((ok, reject, img) => {
    img = new Image(), img.src = src
    const onload = e => {
      img.removeEventListener('load', onload)
      img.removeEventListener('error', onload)
      e.type === 'load' ? ok(img) : reject(e)
    }
    img.addEventListener('load', onload)
    img.addEventListener('error', onload)
  }),
  writeFile: async (handle, name, data) => {
    if (true !== name) {
      handle = await handle.getFileHandle(name, { create: true })
    }
    const writable = await handle.createWritable()
    await writable.write(data)
    await writable.close()
  }
})
