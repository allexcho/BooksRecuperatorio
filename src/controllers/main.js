const bcryptjs = require("bcryptjs");
const { Sequelize } = require("../database/models");
const db = require("../database/models");
const Op = Sequelize.Op;

const mainController = {
  home: (req, res) => {
    db.Book.findAll({
      include: [{ association: "authors" }],
    })
      .then((books) => {
        res.render("home", { books, message: req.session.message });
      })
      .catch((error) => console.log(error));
  },
  bookDetail: (req, res) => {
    let idLibro = req.params.id;
    db.Book.findByPk(idLibro, {
      include: [{ association: "authors" }],
    })
      .then((book) => {
        res.render("bookDetail", { book, message: req.session.message });
      })
      .catch((error) => console.log(error));
  },
  bookSearch: (req, res) => {
    res.render("search", { books: [] , message: req.session.message});
  },
  bookSearchResult: (req, res) => {
    let titulo = req.body.title;
    console.log(titulo);
    if (titulo.length == 0) {
      res.render("search", { books: [] , message: req.session.message });
    }
    db.Book.findAll({
      include: [{ association: "authors" }],
      where: {
        title: {
          [Op.like]: `%${titulo}%`,
        },
      },
    })
      .then((books) => {
        res.render("search", { books, message: req.session.message });
      })
      .catch((error) => console.log(error));
  },
  deleteBook: (req, res) => {
    db.Book.findAll({
      include: [{ association: "authors" }],
      where: {
        id: {
          [Op.ne]: req.params.id
        }
      }
    })
      .then( books => {
        res.render('home', { books, message: req.session.message })
      } )
  },
  authors: (req, res) => {
    db.Author.findAll()
      .then((authors) => {
        res.render("authors", { authors, message: req.session.message });
      })
      .catch((error) => console.log(error));
  },
  authorBooks: (req, res) => {
    db.Author.findAll({
      include: [{ association: "books" }],
      where: {
        id: req.params.id,
      },
    })
      .then((authorBooks) => {
        res.render("authorBooks", { books: authorBooks[0].books, message: req.session.message });
      })
      .catch((error) => console.log(error));
  },
  register: (req, res) => {
    res.render("register", {message: req.session.message});
  },
  processRegister: (req, res) => {
    db.User.create({
      Name: req.body.name,
      Email: req.body.email,
      Country: req.body.country,
      Pass: bcryptjs.hashSync(req.body.password, 10),
      CategoryId: req.body.category,
    })
      .then(() => {
        res.redirect("/");
      })
      .catch((error) => console.log(error));
  },
  login: (req, res) => {
    const cookies = req.cookies.usuario

    if(cookies){
      res.render("login", { email: cookies , message: req.session.message });
    }else{
      res.render("login", { email:"" , message: req.session.message });
    }

  },
  processLogin: async(req, res) => {

    const validarUsuario = {
      email: req.body.email,
      password: req.body.password,
    };
    
    if(validarUsuario.email.length != 0){
      res.cookie("usuario", validarUsuario.email)
    }
    
    const libros = await db.Book.findAll({ include: [{ association: "authors" }]})
    const usuarioEncontrado = db.User.findOne({
      where: {
        email: validarUsuario.email,
      }
    });

    usuarioEncontrado.then( user => {
      if(user){

        let comparar = bcryptjs.compareSync(validarUsuario.password, user.Pass);

        if (comparar) {
          req.session.message = {
            success: `Usuario ${user.Name} logueado`,
            rol: `${user.CategoryId }` 
          }    

        res.redirect('/')
        } else {
          req.session.message = {
            error: `Datos Incorrectos, verifique por favor`
          }  
          res.render("login", { email: req.cookies.usuario, message:req.session.message });
        }
      }else{
        req.session.message = {
          error: `Datos Incorrectos, verifique por favor`
        }  
        res.render("login", { email: req.cookies.usuario, message:req.session.message });
      }
    })

    
  },
  logout: async(req , res) =>{
    const libros = await db.Book.findAll({ include: [{ association: "authors" }]})
    req.session.destroy();
    res.redirect('/')
  },
  edit: (req, res) => {
    let idLibro = req.params.id;
    db.Book.findByPk(idLibro).then((book) => {
      res.render("editBook", { book , message: req.session.message });
    });
  },
  processEdit: async (req, res) => {
    const { title, cover, description } = req.body;

    let datosEditados = {
      title,
      cover,
      description,
    };

    db.Book.update(datosEditados, {
      where: {
        id: req.params.id,
      },
    });

    db.Book.findAll({
      include: [{ association: "authors" }],
    })
      .then((books) => {
        res.redirect('/')
      })
      .catch((error) => console.log(error));
  },
};

module.exports = mainController;
