module.exports = function( grunt ) {
    "use strict";
    
    grunt.registerMultiTask(
        "temp-remove",
        "删除临时文件",
        function() {
            let files = this.data;
            files.forEach(path => {
                if(grunt.file.exists(path)) {
                    try {
                        grunt.file.delete(path);
                    } catch(e) {
                        console.log(e);
                    }
                }
            });
        }
    );
};
