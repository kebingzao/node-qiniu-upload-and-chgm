var exec = require('child_process').exec;
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};

// qrsync 文档： // http://developer.qiniu.com/docs/v6/tools/qrsync.html
var doUpload = function(callback){
    exec('"qiniu/qrsync/qrsync.exe" "qiniu/auth.json"', function (error, stdout, stderr) {
        console.log(stderr.toString());
        console.log(stdout.toString());
        if(stdout.toString().indexOf("Sync done!") > -1){
            callback();
        }
    });
};
// 改变ipa的mime
var doChgm = function(name, mime, callback){
    // 这边qshell已经全局安装了
    exec('qshell chgm dl-airdroid-com '+ name +' ' + mime, function (error, stdout, stderr) {
        console.log(stderr.toString());
        console.log(stdout.toString());
        callback();
    });
};


var doStart = function(){
    doUpload(function(){
        // 上传完之后，开始遍历
        walk('./qiniu-dl', function(err, results) {
            if (err) throw err;
            console.log(results);
            _.each(results,function(item){
                (function(item){
                    var nameIndex = item.lastIndexOf("\\");
                    var name = item.substr(nameIndex + 1);
                    if(name.split(".")[1] == 'ipa'){
                        // 如果是ipa，那么就修改mime (七牛默认上传的ipa是mime不是application/iphone,这样会导致在ie下下载会变成zip包，所以这边要修改回来)
                        doChgm(name, "application/iphone", function(){
                            console.log("修改"+ name + "的mime成功");
                        });
                    }
                })(item);
            })
        });
    });
};

doStart();