import User from "../../../models/User";
import connectMongo from "../../../utils/db";

const handler = async (req, res) => {
    const body = req.body;
    const { nombre } = req.query;
    await connectMongo();
    switch (req.method) {
        case 'GET':
            try {
                const user = await User.find( { names : { $regex : nombre, $options: 'i' } } );
                if(user.length === 0) {
                    const user = await User.find( { email : { $regex : nombre, $options: 'i' } } );
                    return res.status(200).json(user);
                }
                return res.status(200).json(user);
            } catch (error) {
                console.log("Error: ", error);
            }
            return res.status(404).json({ message: "Not found" });
        case 'PUT':
            console.log(req.body);
            try {
                await User.findOneAndUpdate(
                    {email: body.email},
                    req.body
                );
                return res.status(200).json({ message: 'Usuario actualizado con éxito' });
            } catch (error) {
                console.log(error)
            }
            return res.status(401).json({ message: 'Error al actualizar' });
        case 'DELETE':
            try {
                await User.findByIdAndDelete(nombre);
                return res.status(200).json({ message: 'Usuario eliminado' });
            } catch (error) {
                console.log(error);
            }
        default:
            return res.status(500).json({ message: 'No autorizado' });
    }

}

export default handler;
