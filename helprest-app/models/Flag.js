import mongoose from 'mongoose';

const FlagSchema = new mongoose.Schema({
	// alergia, preferencia alimenticia, dieta, etc
	tipo: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	// nome da condicao/doenca/preferencia
	identificador: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	restricao: {
		type: [String],
		required: true,
		lowercase: true,
		trim: true,
	},
	descricao: {
		type: String,
		required: true,
		trim: true,
		maxlength: 300,
	},
	// hashtags e coisas para aspecto social. melhorar mais tarde
	tag: [String],
});

const Flag = mongoose.models.Flag || mongoose.model('Flag', FlagSchema);

export default Flag;
