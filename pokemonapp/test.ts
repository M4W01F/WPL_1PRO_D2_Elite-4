import mongodb, { MongoClient } from "mongodb"

const url = "mongodb+srv://djedje:lxLaIYolmk1eajOM@elite-4.qdbvklf.mongodb.net/"

async function main(){
    const client = new MongoClient(url)


try{
    await client.connect()
    const db = client.db("testDB")
    const users = db.collection("users")

    const result = await users.insertMany([
        {naam : "djedje", leeftijd:20},
        {naam : "adam", leeftijd:20}
    ]);
    console.log("data toegevoegd",result.insertedCount);


} catch (error) {
    console.log("error er iets iets fouts.",error)

} finally{
    await client.close();
}
}
main();