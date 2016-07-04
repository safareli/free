import {join} from 'path'

const include = join(__dirname, 'src')

export default {
  entry: './src/free',
  output: {
    path: join(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Free',
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel', include},
    ]
  }
}
