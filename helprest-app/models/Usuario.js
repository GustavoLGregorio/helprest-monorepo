import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	data_nascimento: {
		type: Date,
		required: true,
	},
	flags: [mongoose.SchemaTypes.ObjectId],
	localizacao_casa: {
		estado: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		cidade: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		bairro: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		endereco: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		cep: {
			type: String,
			required: true,
			trim: true,
			set: (value) => value.replace(/\D/g, ''),
		},
	},
	redes_sociais: [
		{
			nome: String,
			identificador: String,
			visibilidade_publica: Boolean,
		},
	],
	foto_perfil: {
		type: String,
		trim: true,
	},
});

const Usuario =
	mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

export default Usuario;
