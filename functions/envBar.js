exports.handler = async (event) => {
  let foo = process.env.FOO
  let baz = process.env.BAZ

  console.log(foo) // should be 'bar' as set in serverless.yml
  console.log(baz) // should be 'bosh' as set in serverless.yml
  return baz
};