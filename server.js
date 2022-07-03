const express = require("express")
const app = express()
const multer = require("multer")
const PORT = 3000;
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")
require("dotenv").config()
const upload = multer({dest: "uploads"})

app.use(express.urlencoded({extended: true}))
 
app.set("view engine", "ejs")


app.get("/", (req,res)=>{
    res.render("index")
})
app.get("/file/:id", handleDownload)
app.post("/file/:id", handleDownload)

app.post("/upload", upload.single("file"), async(req, res)=>{
    const fileData = {
        path: req.file.path,
        originalname: req.file.originalname 
    }
    if(req.body.password != null && req.body.password !== ""){
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }
    const file = await File.create(fileData)
    res.render("index",{ fileLink: `${req.headers.origin}/file/${file.id}`})


}) 


async function handleDownload(req, res){
    const file = await File.findById(req.params.id)
    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
        
        if(!(await bcrypt.compare(req.body.password, file.password))){
            res.render("password", {error: true})
            console.log("2")
            return
        }
    }
    file.downloadCount++
    await file.save()
    console.log(file.downloadCount)
    res.download(file.path, file.originalname)
}


app.listen(PORT ,async ()=>{
    await mongoose.connect(process.env.MONGO_URI)
    console.log(`Server running on PORT ${PORT} `)
})
