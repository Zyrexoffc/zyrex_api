const express = require('express')
const chalk = require('chalk')
const fs = require('fs')
const cors = require('cors')
const path = require('path')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 4000

app.enable("trust proxy")
app.set("json spaces", 2)

app.use(express.static(path.join(__dirname, 'src')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      ...options
    })
    return res.data
  } catch (err) {
    return err
  }
}

const settings = (() => {
  const _d = (s) => Buffer.from(s, 'base64').toString('utf-8')

  return {
    name: _d("WnlyZXggUmVzdCBBcGk="),
    description: _d("U2ltcGxlIGFuZCBFYXN5LXRvLVVzZSBBUEkgRG9jdW1lbnRhdGlvbiBCb3QgaW50ZWdyYXRpb24u"),
    apiSettings: {
      creator: _d("WnlyZXggT2ZmaWNpYWw="),
      apikey: [_d("WnlyZXg=")]
    },
    linkTelegram: _d("aHR0cHM6Ly90Lm1lL1p5cmV4b2ZmYzM="),
    linkWhatsapp: _d("aHR0cHM6Ly93aGF0c2FwcC5jb20vY2hhbm5lbC8wMDI5VmJDMmFqMzR5bHRSTlh1TVNMM0g="),
    linkYoutube: _d("aHR0cHM6Ly93d3cueW91dHViZS5jb20vQHBpYW50ZWNoeXQ=")
  }
})();

global.apikey = settings.apiSettings.apikey

app.use((req, res, next) => {
  const originalJson = res.json

  res.json = function (data) {
    if (data && typeof data === 'object') {
      const responseData = {
        status: data.status,
        creator: settings.apiSettings.creator || "Created Using Zyrex",
        ...data
      }
      return originalJson.call(this, responseData)
    }
    return originalJson.call(this, data)
  }

  next()
})

let totalRoutes = 0
let rawEndpoints = {}

const apiFolder = path.join(__dirname, './api')

const register = (ep, file) => {
  if (
    ep &&
    ep.name &&
    ep.desc &&
    ep.category &&
    ep.path &&
    typeof ep.run === "function"
  ) {
    const cleanPath = ep.path.split("?")[0]

    app.get(cleanPath, ep.run)

    if (!rawEndpoints[ep.category]) rawEndpoints[ep.category] = []

    rawEndpoints[ep.category].push({
      name: ep.name,
      desc: ep.desc,
      path: ep.path,
      ...(ep.innerDesc ? { innerDesc: ep.innerDesc } : {})
    })

    totalRoutes++
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${file} → ${ep.name} `))
  }
}

fs.readdirSync(apiFolder).forEach((file) => {
  const filePath = path.join(apiFolder, file)

  if (path.extname(file) === '.js') {
    const routeModule = require(filePath)

    if (Array.isArray(routeModule)) {
      routeModule.forEach(ep => register(ep, file))
      return
    }

    register(routeModule, file)

    if (typeof routeModule === "function") {
      routeModule(app)
    }

    if (routeModule.endpoint) {
      register(routeModule.endpoint, file)
    }

    totalRoutes++
  }
})

console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '))
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `))

app.get('/settings', (req, res) => {
  const endpoints = {
    categories: Object.keys(rawEndpoints)
      .sort((a, b) => a.localeCompare(b))
      .map(category => ({
        name: category,
        items: rawEndpoints[category].sort((a, b) => a.name.localeCompare(b.name))
      }))
  }

  settings.categories = endpoints.categories
  res.json(settings)
})

app.get('/dosc', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'))
})

app.get('/donasi', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'donasi.html'))
})

app.listen(PORT, () => {
  console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `))
})

module.exports = app
