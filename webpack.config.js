const path = require('path');

module.exports = {
  mode: 'production',
    entry: './src/index.js',
      output: {
          path: path.resolve(__dirname, 'dist'),
              filename: 'chippr-agi.bundle.js',
                  library: 'ChipprAGI',
                      libraryTarget: 'umd',
                          globalObject: 'this',
                            },
                              module: {
                                  rules: [
                                        {
                                                test: /\.js$/,
                                                        exclude: /node_modules/,
                                                                use: {
                                                                          loader: 'babel-loader',
                                                                                    options: {
                                                                                                presets: ['@babel/preset-env'],
                                                                                                          },
                                                                                                                  },
                                                                                                                        },
                                                                                                                            ],
                                                                                                                              },
                                                                                                                              };
                                                                                                                              const path = require('path');

                                                                                                                              module.exports = {
                                                                                                                                mode: 'production',
                                                                                                                                  entry: './src/index.js',
                                                                                                                                    output: {
                                                                                                                                        path: path.resolve(__dirname, 'dist'),
                                                                                                                                            filename: 'chippr-agi.bundle.js',
                                                                                                                                                library: 'ChipprAGI',
                                                                                                                                                    libraryTarget: 'umd',
                                                                                                                                                        globalObject: 'this',
                                                                                                                                                          },
                                                                                                                                                            module: {
                                                                                                                                                                rules: [
                                                                                                                                                                      {
                                                                                                                                                                              test: /\.js$/,
                                                                                                                                                                                      exclude: /node_modules/,
                                                                                                                                                                                              use: {
                                                                                                                                                                                                        loader: 'babel-loader',
                                                                                                                                                                                                                  options: {
                                                                                                                                                                                                                              presets: ['@babel/preset-env'],
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                      },
                                                                                                                                                                                                                                                          ],
                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                            };
                                                                                                                                                                                                                                                            