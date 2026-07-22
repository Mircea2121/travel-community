import clientPromise from "../../utils/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    await client.db("travel-community").command({
      ping: 1,
    });

    return Response.json({
      success: true,
      message: "Conexiunea cu MongoDB funcționează.",
    });
  } catch (error) {
    console.error("Eroare MongoDB:", error);

    return Response.json(
      {
        success: false,
        message: "Conexiunea cu MongoDB a eșuat.",
      },
      {
        status: 500,
      }
    );
  }
}