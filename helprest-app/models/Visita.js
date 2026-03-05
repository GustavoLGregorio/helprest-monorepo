import mongoose from 'mongoose';

const VisitaSchema = new mongoose.Schema({
	estabelecimento: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	},
	usuario: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	},
	data: {
		type: Date,
		default: Date.now,
		required: true,
	},
	analise: {
		titulo: {
			type: String,
			trim: true,
		},
		corpo: {
			type: String,
			trim: true,
		},
		nota: {
			type: Number,
			min: 0,
			max: 5,
		},
	},
	// usar para criar metricas uteis. ex: saber qual a base de usuarios
	// quem mais visita estabelecimentos e quais flags usam
	flags_equivalentes: {
		type: [mongoose.SchemaTypes.ObjectId],
		// fazer uma funcao para pegar flags de usuario e estabelecimento
		// comparar elas e retornar aqui as que forem iguais
	},
});

const Visita = mongoose.models.Visita || mongoose.model('Visita', VisitaSchema);

export default Visita;
