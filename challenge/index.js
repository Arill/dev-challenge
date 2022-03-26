function parseToBool(value) {
    if (value == '1' ||
        value == 'true' ||
        value == 'yes')
        return true;
    else
        return false;
}

function isValidEmail(email) {
    email = email.split(' ')[0];
    if (email.indexOf('@') != -1) //Email deve ter '@'
        if (email.split('@').length == 2) //Só pode ter 1 '@'
            if (email.indexOf('.', email.indexOf('@')) != -1) //Deve ter '.' depois do '@'
                return email;
    
    return false;
}

function isValidPhone(phone) {
    phone = '55' + phone.replace('(','').replace(')','').replace('-','').replace(' ','');
    if (phone.length >= 12 && phone.length <= 13) //Telefones tem 2 dígitos de país + 2 digitos de DDD + 8 ou 9 dígitos
        if (!isNaN(phone)) //Telefone tem que ser um número
            return phone;
    
    return false;
}

function parseCSV(csv, separator = ',') {
    let headers = csv.slice(0, csv.indexOf('\n')).split('\"').join(''); //Remover aspas
    headers = headers.split(separator); //Separar os campos

    let rows = csv.slice(csv.indexOf('\n') + 1).split('\n');

    //Remover linhas vazias
    rows = rows.filter(function (row) {
        return row != ''; 
    });

    rows = rows.map(function (row) {
        //Campos com aspas (e separador entre aspas)
        let aux = row.split('\"');
        if (aux.length % 2 == 0) 
            return {}; //Se for um número ímpar de aspas, ignorar pois é uma string inválida
        else
        {
            for (let i = 1; i < aux.length; i += 2)
            {
                aux[i] = aux[i].replace(separator,'/'); //Trocar por outro separador
            }
        }
        row = aux.join('');
        row = row.split(separator);
        
        let jsonData = {};
        let addresses = [];
        let groups = [];
        for (let i = 0; i < headers.length; i++) {
            let header = headers[i];
            let values = row[i];

            if (header.split(' ').length > 1) { //Para os campos do tipo address
                if (!values)
                    continue;
                let type = header.slice(0, header.indexOf(' '));
                let tags = header.slice(header.indexOf(' ') + 1).split(' ');

                //Os campos podem ter múltiplos valores sob as mesmas tags e tipo
                values = values.split('/');
                values.forEach(function (value) {
                    let address = {};
                    value = value.trim();
                    if (!value)
                        return;
                    if (type.toLowerCase() == 'phone')
                        value = isValidPhone(value);
                    if (type.toLowerCase() == 'email')
                        value = isValidEmail(value);
                    if (value) {
                        address['type'] = type;
                        address['tags'] = tags;
                        address['address'] = value;
                        
                        addresses.push(address);
                    }
                });
            }
            else //Para os grupos
            {
                if (header.toLowerCase() == 'group') {

                    //Os campos de grupos podem ter vários valores agrupados
                    values = values.split('/');
                    values.forEach(function (value){
                        value = value.trim();
                        if (value != '')
                            groups.push(value);
                    });
                }
                else //Para os demais campos
                {
                    //Ajustar valores booleanos para padrões
                    if (header == 'invisible' || header == 'see_all')
                        values = parseToBool(values);
                    jsonData[header] = values;
                }
            }
        }

        jsonData['groups'] = groups;
        jsonData['addresses'] = addresses;

        return jsonData;
    });

    //Procurar e agregar os duplicados
    rows.forEach(function (row) {
        for (let i = rows.length - 1; i > rows.indexOf(row); i--)
            if (row['eid'] == rows[i]['eid'])
            {
                //Juntar os grupos removendo duplicatas
                row['groups'] = row['groups'].concat(
                    rows[i]['groups'].filter(function (group) {
                        return row['groups'].indexOf(group) < 0;
                    })
                );
                
                //Juntar os addresses removendo duplicatas
                row['addresses'] = row['addresses'].concat(
                    rows[i]['addresses'].filter(function (group) {
                        return row['addresses'].indexOf(group) < 0;
                    })
                );

                //invisible se algum deles for invisible
                row['invisible'] = row['invisible'] || rows[i]['invisible'];
                
                //see_all apenas se ambos forem see_all
                row['see_all'] = row['see_all'] && rows[i]['see_all'];

                //Remover a linha duplicada
                rows.splice(i,1);
            }
    });

    //Retornar o array em formato json
    return JSON.stringify(rows);
}

//Main
fs = require('fs');
var csv = fs.readFileSync('input.csv','utf8');
var json = parseCSV(csv);
fs.writeFileSync('output.json', json, 'utf8');