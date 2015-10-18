# grunt-symlinkassets

> Swap asset src/href using symlinks.


```shell
npm install grunt-symlinkassets --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-symlinkassets');
```

## The "symlinkassets" task

### Overview
In your project's Gruntfile, add a section named `symlinkassets` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  symlinkassets: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```
