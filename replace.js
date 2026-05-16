const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var pending = list.length;
        if (!pending) return callback(null, []);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        let content = fs.readFileSync(file, 'utf8');
                        content = content.replace(/Voucher/g, 'Template');
                        content = content.replace(/voucher/g, 'template');
                        content = content.replace(/VOUCHER/g, 'TEMPLATE');
                        fs.writeFileSync(file, content, 'utf8');
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk('d:\\SEP490_BackEnd\\SEP490_Children-s-Toy_FE_Admin\\src\\features\\template', function(err) {
    if (err) throw err;
    console.log('Done');
});
