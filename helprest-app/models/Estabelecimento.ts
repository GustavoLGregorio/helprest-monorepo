import mongoose, { VirtualTypeOptions } from "mongoose";

/**
 * adicionar mais tarde mais opções para gerentes:
 * gerenciamento de filiais pela matriz
 * visitas concluidas oriundas do app
 * etc
 **/

export type LocalizacaoType = {
	pais: string;
	estado: string;
	cidade: string;
	bairro: string;
	endereco: string;
	cep: string;
};
export type RedirectType = {
	para: string;
	tipo: string;
	link: string;
};
export type EstabelecimentoType = {
	empresa: string;
	cnpj: string;
	matriz: boolean;
	unidade: string;
	localizacao: LocalizacaoType;
	coordenadas: [number, number];
	email: string;
	telefone: string;
	flags: string[];
	logo_empresa: string;
	fotos: [string];
	nota_estabelecimento: number;
	redirecionamento: RedirectType;
};

const EstabelecimentoSchema = new mongoose.Schema<EstabelecimentoType>({
	empresa: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	cnpj: {
		type: String,
		required: true,
		trim: true,
		set: (value: string) => value.replace(/\D/g, ""),
	},
	matriz: {
		type: Boolean,
		required: true,
	},
	unidade: {
		type: String,
		lowercase: true,
		trim: true,
	},
	localizacao: {
		pais: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
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
			set: (value: string) => value.replace(/\D/g, ""),
		},
	},
	coordenadas: {
		type: [Number],
		index: "2dsphere",
	},
	email: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	telefone: {
		type: String,
		required: true,
		trim: true,
		set: (value: string) => value.replace(/\D/g, ""),
	},
	flags: {
		// type: [mongoose.SchemaTypes.ObjectId],
		type: [String],
	},
	logo_empresa: {
		type: String,
		trim: true,
	},
	fotos: [
		{
			type: String,
			trim: true,
		},
	],
	nota_estabelecimento: {
		type: Number,
		min: 0,
		max: 100,
	},
	redirecionamento: [
		{
			para: {
				// talvez fazer posteriormente uma collection para apps conhecidos
				// para reconhecer por id, retornar nome, logo e outras infos
				type: String,
				lowercase: true,
				trim: true,
			},
			tipo: {
				// delivery, rede social, plataforma própria, etc
				type: String,
				lowercase: true,
				trim: true,
			},
			link: {
				type: String,
				trim: true,
			},
		},
	],
});

EstabelecimentoSchema.pre("save", async function (next) {
	if (
		!this.isModified("localizacao.endereco") &&
		!this.isModified("localizacao.bairro") &&
		!this.isModified("localizacao.cidade") &&
		!this.isModified("localizacao.estado") &&
		!this.isModified("localizacao.pais")
	) {
		return next();
	}

	const location = this.localizacao;

	if (!location) return;

	const fullAddress = `${location.endereco}, ${location.bairro}, ${location.cidade}, ${location.estado}, ${location.pais}`;

	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json`,
		);
		const data = await response.json();

		if (data && data[0]) {
			this.coordenadas = [data[0].lon, data[0].lat];
		} else {
			console.warn("Endereço não encontrado pelo Nominatim.");
		}

		next();
	} catch (error) {
		console.error("Erro ao buscar coordenadas: ", error);
		next();
	}
});

export const Estabelecimento =
	mongoose.models.Estabelecimento || mongoose.model("Estabelecimento", EstabelecimentoSchema);
